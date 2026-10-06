// Native vectors retain the supplied charts' axes, series, markers, line styles,
// pie colours and printed percentages. Unlabelled graph points are estimates.
export function InternationalStudentsChart() {
  const values = [[60, 70, 90, 110, 120], [20, 19, 20, 30, 20], [50, 55, 50, 55, 50], [40, 40, 35, 40, 70]]
  const styles = [undefined, '9 8', '2 3', undefined]
  const x = (i: number) => 120 + i * 61.5
  const y = (v: number) => 434 - v * 239 / 140
  const marker = (i: number, cx: number, cy: number) => i === 0
    ? <path d={`M${cx} ${cy - 4}l3.5 4l-3.5 4l-3.5-4Z`} />
    : i === 1 ? <rect x={cx - 3} y={cy - 3} width="6" height="6" />
      : <path d={`M${cx} ${cy - 3.5}l3.5 6h-7Z`} />
  return <svg viewBox="16 144 535 354" className="h-auto w-full" role="img" aria-label="International students at a UK university, 1995–2015: Asia, Africa, Europe and North America" data-supplied-writing-diagram="international-students">
    <rect x="16" y="144" width="535" height="354" fill="white" />
    <rect x="21" y="151" width="518" height="341" fill="none" stroke="#ccc" strokeWidth="1.5" />
    <g fontFamily="Arial, Helvetica, sans-serif" fill="#111">
      <text x="280" y="176" textAnchor="middle" fontSize="18" fontWeight="700">International students at a UK university</text>
      {Array.from({ length: 8 }, (_, i) => i * 20).map(v => <g key={v}><line x1="91" x2="395" y1={y(v)} y2={y(v)} stroke="#bbb" strokeWidth="1.2" /><line x1="86" x2="91" y1={y(v)} y2={y(v)} stroke="#888" /><text x="80" y={y(v) + 4.5} fontSize="13" textAnchor="end" fill="#555">{v}</text></g>)}
      <path d="M91 195V434H395" fill="none" stroke="#aaa" strokeWidth="1.2" />
      {[1995, 2000, 2005, 2010, 2015].map((year, i) => <g key={year}><line x1={x(i)} x2={x(i)} y1="434" y2="439" stroke="#888" /><text x={x(i)} y="454" textAnchor="middle" fontSize="13" fill="#555">{year}</text></g>)}
      <text transform="translate(49 315) rotate(-90)" textAnchor="middle" fontSize="14" fontWeight="700">Students</text><text x="243" y="476" textAnchor="middle" fontSize="14" fontWeight="700">Year</text>
      {values.map((series, i) => <g key={i}><path d={series.map((v, j) => `${j ? 'L' : 'M'}${x(j)} ${y(v)}`).join(' ')} fill="none" stroke="#222" strokeWidth="2.2" strokeDasharray={styles[i]} />{i < 3 && series.map((v, j) => <g key={j} fill="#222">{marker(i, x(j), y(v))}</g>)}</g>)}
      {['Asia', 'Africa', 'Europe', 'North America'].map((name, i) => <g key={name}><line x1="415" x2="443" y1={305 + i * 21} y2={305 + i * 21} stroke="#222" strokeWidth="2.2" strokeDasharray={styles[i]} />{i < 3 && marker(i, 429, 305 + i * 21)}<text x="446" y={309 + i * 21} fontSize="13">{name}</text></g>)}
    </g>
  </svg>
}

function EnergyPie({ x, year, percentages }: { x: number; year: number; percentages: string[] }) {
  // Clockwise from the upper-left Coal boundary: Coal, Other, Nuclear, Petro, Gas.
  const ordered = [0, 4, 3, 2, 1]
  const total = percentages.reduce((sum, p) => sum + Number(p), 0)
  let angle = -Number(percentages[0]) / total * 360
  const point = (degrees: number) => [x + 69 * Math.cos(degrees * Math.PI / 180), 325 + 69 * Math.sin(degrees * Math.PI / 180)]
  const colours = ['black', '#bdbdbd', '#ffa500', '#ff0000', '#008000']
  return <g>
    <text x={x} y="217" textAnchor="middle" fontSize="13" fontWeight="700">{year}</text>
    {ordered.map(i => {
      const start = point(angle)
      angle += Number(percentages[i]) / total * 360
      const end = point(angle)
      return <path key={i} d={`M${x} 325L${start[0]} ${start[1]}A69 69 0 0 1 ${end[0]} ${end[1]}Z`} fill={colours[i]} stroke="#555" strokeWidth=".6" />
    })}
    {[
      { name: 'Coal', dx: 47, y: year === 1995 ? 249 : 242 },
      { name: 'Gas', dx: -78, y: year === 1995 ? 292 : 300 },
      { name: 'Petro', dx: -7, y: 419 },
      { name: 'Nuclear', dx: 92, y: year === 1995 ? 367 : 404 },
      { name: 'Other', dx: 93, y: year === 1995 ? 337 : 354 },
    ].map((label, i) => <g key={label.name} fontSize="11.5" fontWeight="700" textAnchor="middle"><text x={x + label.dx} y={label.y}>{label.name}</text><text x={x + label.dx} y={label.y + 13}>{percentages[i]}%</text></g>)}
  </g>
}

export function EnergyProductionPies() {
  return <svg viewBox="38 152 510 297" className="h-auto w-full" role="img" aria-label="Comparison of Energy Production in a European country, 1995 and 2005" data-supplied-writing-diagram="energy-production">
    <rect x="38" y="152" width="510" height="297" fill="white" />
    <g fontFamily="Arial, Helvetica, sans-serif" fill="#111"><text x="292" y="181" textAnchor="middle" fontSize="18" fontWeight="700">Comparison of Energy Production</text><EnergyPie x={170} year={1995} percentages={['29.80', '29.63', '29.27', '6.40', '4.90']} /><EnergyPie x={424} year={2005} percentages={['30.93', '30.31', '19.55', '10.10', '9.10']} /></g>
  </svg>
}

export function HospitalClinicsChart() {
  const values = [[240, 280, 180, 240], [125, 150, 250, 350], [65, 80, 100, 175], [100, 60, 125, 130]]
  const styles = [undefined, '6 4', '1 1.5', '7 4 1 4']
  const x = (i: number) => 114 + i * 88
  const y = (v: number) => 221 - v * 150 / 400
  return <svg viewBox="35 37 400 226" className="h-auto w-full" role="img" aria-label="Number of patients to four clinics in one hospital, 2010–2016: Birth control, Eye, Diabetic, Dental" data-supplied-writing-diagram="hospital-clinics">
    <rect x="35" y="37" width="400" height="226" fill="white" />
    <g fontFamily="Arial, Helvetica, sans-serif" fill="#111">
      <text x="235" y="52" textAnchor="middle" fontSize="12">Number of patients to four clinics in one hospital</text>
      {Array.from({ length: 9 }, (_, i) => i * 50).map(v => <g key={v}><line x1="71" x2="418" y1={y(v)} y2={y(v)} stroke="#555" strokeWidth=".7" /><text x="66" y={y(v) + 3} textAnchor="end" fontSize="8">{v}</text></g>)}
      {[2010, 2012, 2014, 2016].map((year, i) => <text key={year} x={x(i)} y="234" textAnchor="middle" fontSize="8">{year}</text>)}
      {values.map((series, i) => <path key={i} d={series.map((v, j) => `${j ? 'L' : 'M'}${x(j)} ${y(v)}`).join(' ')} fill="none" stroke="#111" strokeWidth={i ? 1 : 1.2} strokeDasharray={styles[i]} />)}
      {['Birth control', 'Eye', 'Diabetic', 'Dental'].map((label, i) => <g key={label}><line x1={124 + i * 72} x2={145 + i * 72} y1="249" y2="249" stroke="#111" strokeWidth="1" strokeDasharray={styles[i]} /><text x={147 + i * 72} y="251" fontSize="7">{label}</text></g>)}
    </g>
  </svg>
}

export function NewZealandLeisureCharts() {
  const labels = ['15-24', '25-34', '35-44', '45-54', '55+']
  return <svg viewBox="38 139 314 373" className="h-auto w-full" role="img" aria-label="Average minutes spent on reading for pleasure and listening to music by age group in New Zealand" data-supplied-writing-diagram="new-zealand-leisure">
    <rect x="38" y="139" width="314" height="373" fill="white" />
    <g fontFamily="Arial, Helvetica, sans-serif" fill="#111">
      {[
        { title: 'Average minutes spent on reading for pleasure', top: 168, bottom: 274, values: [20, 35, 45, 50, 70] },
        { title: 'Average minutes spent on listening to music', top: 333, bottom: 437, values: [80, 60, 45, 60, 75] },
      ].map(chart => {
        const y = (value: number) => chart.bottom - value / 90 * (chart.bottom - chart.top)
        return <g key={chart.title}>
          <text x="191" y={chart.top - 12} textAnchor="middle" fontSize="8.5" fontWeight="700">{chart.title}</text>
          {Array.from({ length: 10 }, (_, i) => i * 10).map(value => <g key={value}><line x1="81" x2="308" y1={y(value)} y2={y(value)} stroke="#e4e4e4" strokeWidth=".4" /><text x="76" y={y(value) + 2} textAnchor="end" fontSize="6">{value}</text></g>)}
          <path d={`M81 ${chart.top - 4}V${chart.bottom}H308`} fill="none" stroke="#555" strokeWidth=".6" />
          <text transform={`translate(56 ${(chart.top + chart.bottom) / 2}) rotate(-90)`} textAnchor="middle" fontSize="6" fontWeight="700">Minutes per day</text>
          {chart.values.map((value, i) => <g key={i}><rect x={97 + i * 43} y={y(value)} width="15" height={chart.bottom - y(value)} fill="#a7a8aa" /><text x={104.5 + i * 43} y={chart.bottom + 11} textAnchor="middle" fontSize="5.5">{labels[i]}</text></g>)}
          <text x="318" y={chart.bottom + 11} textAnchor="middle" fontSize="5.5" fontWeight="700">Age groups</text>
        </g>
      })}
      <text x="45" y="506" fontSize="7">Hanexenglish.edu.vn</text><text x="339" y="506" textAnchor="end" fontSize="7">1</text>
    </g>
  </svg>
}

export function TouristOfficeChart() {
  const values = [[450, 600, 800, 1250, 1550, 1900], [750, 700, 700, 550, 350, 350], [900, 800, 1000, 1000, 1400, 1600]]
  const colours = ['#74add0', '#c4544c', '#9fc458']
  const x = (i: number) => 95 + i * 49.6
  const y = (value: number) => 306 - value * 232 / 2000
  const marker = (series: number, cx: number, cy: number) => series === 0
    ? <path d={`M${cx} ${cy - 3.3}l3.3 3.3l-3.3 3.3l-3.3-3.3Z`} />
    : series === 1 ? <rect x={cx - 2.7} y={cy - 2.7} width="5.4" height="5.4" />
      : <path d={`M${cx} ${cy - 3.5}l3.5 6h-7Z`} />
  return <svg viewBox="18 0 483 336" className="h-auto w-full" role="img" aria-label="IELTS Task 1: Tourist Office. Requests in person, by letter/email and by telephone from January to June" data-supplied-writing-diagram="tourist-office">
    <rect x="18" width="483" height="336" fill="white" />
    <g fontFamily="Arial, Helvetica, sans-serif" fill="#111">
      <text x="20" y="18" fontSize="18" fill="#444">IELTS Task 1: Tourist Office</text>
      <rect x="29" y="62" width="464" height="266" fill="none" stroke="#888" />
      {Array.from({ length: 11 }, (_, i) => i * 200).map(value => <g key={value}><line x1="71" x2="368" y1={y(value)} y2={y(value)} stroke="#aaa" strokeWidth=".7" /><line x1="67" x2="71" y1={y(value)} y2={y(value)} stroke="#aaa" /><text x="62" y={y(value) + 4} textAnchor="end" fontFamily="Georgia, 'Times New Roman', serif" fontSize="12">{value}</text></g>)}
      <path d="M71 74V306H368" fill="none" stroke="#aaa" strokeWidth=".7" />
      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => <g key={month}><line x1={x(i)} x2={x(i)} y1="306" y2="310" stroke="#aaa" /><text x={x(i)} y="323" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="12">{month}</text></g>)}
      {values.map((series, i) => <g key={i}><path d={series.map((value, j) => `${j ? 'L' : 'M'}${x(j)} ${y(value)}`).join(' ')} fill="none" stroke="#111" strokeWidth="1.6" />{series.map((value, j) => <g key={j} fill={colours[i]} stroke={['#3d789d', '#923c37', '#789642'][i]} strokeWidth=".5">{marker(i, x(j), y(value))}</g>)}</g>)}
      {['in person', 'by letter/email', 'by telephone'].map((label, i) => <g key={label}><line x1="385" x2="407" y1={177 + i * 20} y2={177 + i * 20} stroke="#111" strokeWidth="1.3" /><g fill={colours[i]} stroke="#777" strokeWidth=".4">{marker(i, 396, 177 + i * 20)}</g><text x="410" y={181 + i * 20} fontFamily="Georgia, 'Times New Roman', serif" fontSize="12">{label}</text></g>)}
    </g>
  </svg>
}
