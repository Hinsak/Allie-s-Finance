import Image from "next/image";

export default function AboutPage() {
  return (
    <div>
      <div className="flex flex-col items-center text-center py-6">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border border-line mb-5">
          <Image
            src="/hinsak.jpg"
            alt="흰색이"
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
        <h1 className="text-xl font-medium mb-2">흰색이의 금융 이야기</h1>
        <p className="text-sm text-muted max-w-md leading-relaxed">
            금융, 무역, 기술(블록체인과 엔지니어링 등)에 관심 많고, 
            <br />
            산업이나 기업에 대해 분석해 레포트 쓰기 좋아합니다!
            <br />
            관련 내용 전공 중이고, 학회에서 쓴 레포트와 개인 작성 에세이 업로드합니다🐻‍❄️
            <br />
            This website serves as a personal repository.
        </p>
      </div>
    </div>
  );
}
