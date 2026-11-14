const bullet = /^(?:[•*-])\s+(.+)$/;
const inlineHeading = /^([^:]{3,90}):\s+(.+)$/;

/** Plain-text paragraphs and lists. Provider text never becomes HTML or executable links. */
export function SupportChatAnswer({ text }: { text: string }) {
  return <div className="space-y-4 text-[15px] leading-[1.65] [overflow-wrap:anywhere]">
    {text.split(/\n\s*\n/).filter(block => block.trim()).map((block, index) => {
      const lines = block.trim().split('\n').map(line => line.trim()).filter(Boolean);
      const hasHeading = lines.length > 1 && !bullet.test(lines[0]) && lines.slice(1).every(line => bullet.test(line));
      const items = hasHeading ? lines.slice(1) : lines;
      if (items.every(line => bullet.test(line))) {
        return <section key={index} className="space-y-1.5">
          {hasHeading ? <h3 className="font-semibold tracking-[-0.01em]">{lines[0].replace(/^\d+[.)]\s+/, '')}</h3> : null}
          <ul className={`list-disc pl-5 marker:text-brand-teal ${items.some(line => inlineHeading.test(bullet.exec(line)![1])) ? 'space-y-3' : 'space-y-1'}`}>
            {items.map((line, itemIndex) => {
              const content = bullet.exec(line)![1];
              const heading = inlineHeading.exec(content);
              return <li key={itemIndex} className="pl-0.5">
                {heading ? <><h3 className="font-semibold tracking-[-0.01em]">{heading[1]}</h3><p className="mt-1">{heading[2]}</p></> : content}
              </li>;
            })}
          </ul>
        </section>;
      }
      return <p key={index} className="whitespace-pre-line">{block.trim()}</p>;
    })}
  </div>;
}
