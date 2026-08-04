import { Client, isFullPage, isFullBlock } from "@notionhq/client";
import type {
  PageObjectResponse,
  BlockObjectResponse,
  RichTextItemResponse,
  QueryDatabaseResponse
} from "@notionhq/client/build/src/api-endpoints";

// 환경변수: NOTION_TOKEN, NOTION_DATABASE_ID
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID as string;

// 게시 여부로 인정할 상태 값들 (Notion "상태" 속성 값에 맞게 자유롭게 수정하세요)
const PUBLISHED_VALUES = ["게시", "발행", "Published", "Done", "완료"];

export type PostSummary = {
  id: string;
  title: string;
  date: string | null;
  cover: string | null;
  tags: string[];
};

export type PostDetail = PostSummary & {
  html: string;
};

// ---------- Notion 텍스트 색상 → CSS 매핑 ----------
const TEXT_COLOR: Record<string, string> = {
  gray: "#9b9a97",
  brown: "#64473a",
  orange: "#d9730d",
  yellow: "#dfab01",
  green: "#0f7b6c",
  blue: "#0b6e99",
  purple: "#6940a5",
  pink: "#ad1a72",
  red: "#e03e3e"
};

const BG_COLOR: Record<string, string> = {
  gray: "#ebeced",
  brown: "#e9e5e3",
  orange: "#faebdd",
  yellow: "#fbf3db",
  green: "#ddedea",
  blue: "#ddebf1",
  purple: "#eae4f2",
  pink: "#f4dfeb",
  red: "#fbe4e4"
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function richTextToHtml(rich: RichTextItemResponse[] | undefined): string {
  if (!rich || rich.length === 0) return "";
  return rich
    .map((item) => {
      let text = escapeHtml(item.plain_text).replace(/\n/g, "<br/>");
      const a = item.annotations;
      const styles: string[] = [];

      if (a.color && a.color !== "default") {
        if (a.color.endsWith("_background")) {
          const base = a.color.replace("_background", "");
          styles.push(`background-color:${BG_COLOR[base] || "#eee"}`);
          styles.push(`padding:0.1em 0.2em`);
          styles.push(`border-radius:3px`);
        } else {
          styles.push(`color:${TEXT_COLOR[a.color] || "inherit"}`);
        }
      }

      if (a.bold) text = `<strong>${text}</strong>`;
      if (a.italic) text = `<em>${text}</em>`;
      if (a.strikethrough) text = `<s>${text}</s>`;
      if (a.underline) text = `<u>${text}</u>`;
      if (a.code) text = `<code>${text}</code>`;

      if (styles.length > 0) {
        text = `<span style="${styles.join(";")}">${text}</span>`;
      }

      if (item.href) {
        text = `<a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }

      return text;
    })
    .join("");
}

function fileUrlAndName(
  fileField: any,
  fallback = "첨부파일"
): { url: string; name: string } {
  const url =
    fileField?.type === "external" ? fileField.external.url : fileField?.file?.url;
  const captionText =
    fileField?.caption?.map((c: RichTextItemResponse) => c.plain_text).join("") || "";
  let name = captionText;
  if (!name && url) {
    try {
      const pathname = decodeURIComponent(new URL(url).pathname);
      const last = pathname.split("/").pop();
      if (last) name = last;
    } catch {
      name = fallback;
    }
  }
  return { url: url || "#", name: name || fallback };
}

async function fetchChildren(blockId: string): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined = undefined;
  do {
    const res = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor
    });
    blocks.push(...(res.results.filter(isFullBlock) as BlockObjectResponse[]));
    cursor = res.has_more ? (res.next_cursor as string) : undefined;
  } while (cursor);
  return blocks;
}

async function blockToHtml(block: BlockObjectResponse): Promise<string> {
  const children = block.has_children ? await fetchChildren(block.id) : [];
  const childrenHtml = children.length > 0 ? await blocksToHtml(children) : "";

  switch (block.type) {
    case "paragraph":
      return `<p>${richTextToHtml(block.paragraph.rich_text)}</p>`;
    case "heading_1":
      return `<h1>${richTextToHtml(block.heading_1.rich_text)}</h1>${childrenHtml}`;
    case "heading_2":
      return `<h2>${richTextToHtml(block.heading_2.rich_text)}</h2>${childrenHtml}`;
    case "heading_3":
      return `<h3>${richTextToHtml(block.heading_3.rich_text)}</h3>${childrenHtml}`;
    case "quote":
      return `<blockquote>${richTextToHtml(block.quote.rich_text)}${childrenHtml}</blockquote>`;
    case "callout": {
      const emoji =
        block.callout.icon?.type === "emoji" ? block.callout.icon.emoji : "";
      return `<div class="callout"><span class="callout-icon">${emoji}</span><div>${richTextToHtml(
        block.callout.rich_text
      )}${childrenHtml}</div></div>`;
    }
    case "bulleted_list_item":
      return `<li>${richTextToHtml(block.bulleted_list_item.rich_text)}${childrenHtml}</li>`;
    case "numbered_list_item":
      return `<li>${richTextToHtml(block.numbered_list_item.rich_text)}${childrenHtml}</li>`;
    case "to_do":
      return `<li class="todo"><input type="checkbox" disabled ${
        block.to_do.checked ? "checked" : ""
      }/> ${richTextToHtml(block.to_do.rich_text)}${childrenHtml}</li>`;
    case "toggle":
      return `<details><summary>${richTextToHtml(
        block.toggle.rich_text
      )}</summary>${childrenHtml}</details>`;
    case "code": {
      const codeText = block.code.rich_text.map((r) => r.plain_text).join("");
      return `<pre><code>${escapeHtml(codeText)}</code></pre>`;
    }
    case "divider":
      return `<hr/>`;
    case "image": {
      const { url, name } = fileUrlAndName(block.image, "이미지");
      return `<img src="${escapeHtml(url)}" alt="${escapeHtml(name)}" loading="lazy" />`;
    }
    case "file":
    case "pdf": {
      const field = block.type === "file" ? block.file : block.pdf;
      const { url, name } = fileUrlAndName(field, "첨부파일");
      const ext = (name.split(".").pop() || "").toUpperCase();
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="file-card">
        <span class="file-card-icon">${ext || "FILE"}</span>
        <span class="file-card-info">
          <span class="file-card-name">${escapeHtml(name)}</span>
          <span class="file-card-meta">${ext || "파일"} 다운로드</span>
        </span>
      </a>`;
    }
    case "bookmark":
      return `<p><a href="${escapeHtml(
        block.bookmark.url
      )}" target="_blank" rel="noopener noreferrer">${escapeHtml(block.bookmark.url)}</a></p>`;
    case "video": {
      const { url } = fileUrlAndName(block.video, "동영상");
      return `<p><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">동영상 링크 열기</a></p>`;
    }
    case "table":
      return `<table>${childrenHtml}</table>`;
    case "table_row": {
      const cells = block.table_row.cells
        .map((cell) => `<td>${richTextToHtml(cell)}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    }
    case "column_list":
      return `<div class="columns">${childrenHtml}</div>`;
    case "column":
      return `<div class="column">${childrenHtml}</div>`;
    case "synced_block":
      return childrenHtml;
    case "table_of_contents":
      return "";
    case "equation":
      return `<p><code>${escapeHtml(block.equation.expression)}</code></p>`;
    default:
      return "";
  }
}

async function blocksToHtml(blocks: BlockObjectResponse[]): Promise<string> {
  let html = "";
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      const tag = block.type === "bulleted_list_item" ? "ul" : "ol";
      let group = "";
      while (i < blocks.length && blocks[i].type === block.type) {
        group += await blockToHtml(blocks[i]);
        i++;
      }
      html += `<${tag}>${group}</${tag}>`;
      continue;
    }

    if (block.type === "to_do") {
      let group = "";
      while (i < blocks.length && blocks[i].type === "to_do") {
        group += await blockToHtml(blocks[i]);
        i++;
      }
      html += `<ul class="todo-list">${group}</ul>`;
      continue;
    }

    html += await blockToHtml(block);
    i++;
  }
  return html;
}

// ---------- 속성(property) 읽기 ----------
function getPlainTitle(page: PageObjectResponse): string {
  const props = page.properties;
  for (const key of Object.keys(props)) {
    const prop = props[key];
    if (prop.type === "title") {
      return prop.title.map((t) => t.plain_text).join("") || "제목 없음";
    }
  }
  return "제목 없음";
}

function getDateValue(page: PageObjectResponse): string | null {
  const props = page.properties;
  for (const key of Object.keys(props)) {
    const prop = props[key];
    if (prop.type === "date" && prop.date?.start) {
      return prop.date.start;
    }
  }
  return null;
}

function getStatusValue(page: PageObjectResponse): string | null {
  const props = page.properties;
  for (const key of Object.keys(props)) {
    const prop = props[key];
    if (prop.type === "status" && prop.status?.name) {
      return prop.status.name;
    }
    if (prop.type === "select" && prop.select?.name) {
      return prop.select.name;
    }
  }
  return null;
}

function getTags(page: PageObjectResponse): string[] {
  const props = page.properties;
  for (const key of Object.keys(props)) {
    const prop = props[key];
    if (prop.type === "multi_select") {
      return prop.multi_select.map((t) => t.name);
    }
  }
  return [];
}

function getCoverImage(page: PageObjectResponse): string | null {
  if (page.cover) {
    if (page.cover.type === "external") return page.cover.external.url;
    if (page.cover.type === "file") return page.cover.file.url;
  }
  return null;
}

function toSummary(page: PageObjectResponse): PostSummary {
  return {
    id: page.id,
    title: getPlainTitle(page),
    date: getDateValue(page),
    cover: getCoverImage(page),
    tags: getTags(page)
  };
}

export async function getPublishedPosts(): Promise<PostSummary[]> {
  const response: QueryDatabaseResponse = await notion.databases.query({
    database_id: DATABASE_ID,
    sorts: [{ timestamp: "created_time", direction: "descending" }]
  });

  const pages = response.results.filter(isFullPage) as PageObjectResponse[];

  const published = pages.filter((page) => {
    const status = getStatusValue(page);
    if (status === null) return true;
    return PUBLISHED_VALUES.includes(status);
  });

  return published.map(toSummary).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export async function getPostDetail(id: string): Promise<PostDetail | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    if (!isFullPage(page)) return null;

    const blocks = await fetchChildren(id);
    const html = await blocksToHtml(blocks);

    return {
      ...toSummary(page),
      html
    };
  } catch (error) {
    console.error("Notion 글 조회 실패:", error);
    return null;
  }
}
