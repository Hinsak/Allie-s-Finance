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
        <h1 className="text-xl font-medium mb-2">Allie's Finance</h1>
        <p className="text-sm text-muted max-w-md leading-relaxed">
          No introduction yet. 

          Interested in trade, finance, and technology (blockchain, engineering),
          with analysis in companies and industries. 
          
          If you want to get in touch...
        </p>
      </div>
    </div>
  );
}
