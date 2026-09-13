export function SectionTitle({ kicker, title, align = 'center', light = false, children }) {
  return (
    <div className={`section-title section-title--${align}${light ? ' section-title--light' : ''}`}>
      {kicker ? <span className="section-title__kicker">{kicker}</span> : null}
      {title ? <h2 className="section-title__title">{title}</h2> : null}
      {children}
    </div>
  );
}

export default SectionTitle;
