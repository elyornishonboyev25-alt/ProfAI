import { useState } from 'react'

/** The reference panel is shared by mock exams, Question Bank and hard practice. */
export default function SATResponseDirections() {
  const [expanded, setExpanded] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width: 900px)').matches)
  return <section className="sat-response-directions" aria-label="Student-produced response directions">
    <details open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}>
    <summary>Student-Produced Response Directions</summary>
    <div className="sat-response-directions-content">
    <ul>
      <li>If you find more than one correct answer, enter only one answer.</li>
      <li>Enter a whole number, a decimal or a fraction. Use a minus sign for a negative answer.</li>
      <li>If your answer is a fraction, you can enter its decimal equivalent.</li>
      <li>For a repeating decimal, use at least four decimal places. You can round or truncate the last digit.</li>
      <li>If your answer is a mixed number (such as 3½), enter it as an improper fraction (7/2) or its decimal equivalent (3.5).</li>
      <li>Do not enter a percent sign, comma or dollar sign.</li>
    </ul>
    <h3>Examples</h3>
    <div className="sat-response-examples">
      <table>
        <caption className="sr-only">Examples of acceptable and unacceptable answer formats</caption>
        <thead><tr><th scope="col">Answer</th><th scope="col">Acceptable ways to enter answer</th><th scope="col">Unacceptable</th></tr></thead>
        <tbody>
          <tr><th scope="row">3.5</th><td>3.5, 3.50, 7/2</td><td>3½<br />3 1/2</td></tr>
          <tr><th scope="row">2/3</th><td>2/3, .6666, .6667, 0.6666, 0.6667</td><td>0.66, .66, 0.67, .67</td></tr>
          <tr><th scope="row">−1/3</th><td>-1/3, -.3333, -0.3333</td><td>-.33, -0.33</td></tr>
        </tbody>
      </table>
    </div>
    </div>
    </details>
  </section>
}
