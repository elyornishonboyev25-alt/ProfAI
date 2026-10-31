"""Exercise the actual shared exam components at desktop and mobile sizes."""
from pathlib import Path
from time import monotonic, sleep
from urllib.request import urlopen
from playwright.sync_api import sync_playwright

base = 'http://127.0.0.1:5195'
output = Path('../../tmp/exam-workspace-previews').resolve()
output.mkdir(parents=True, exist_ok=True)
deadline = monotonic() + 90
while True:
    try:
        urlopen(base, timeout=2).close()
        break
    except OSError:
        if monotonic() > deadline:
            raise
        sleep(.5)

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('dialog', lambda dialog: dialog.accept())
    page.goto(base + '/sat/hard-questions?section=math&level=all', wait_until='networkidle')
    for level in ['easy', 'medium', 'hard']:
        assert page.locator('.hard-tile.is-' + level).count() > 0
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    page.screenshot(path=str(output / 'sat-collection-desktop.png'), full_page=True)
    page.locator('.hard-tile.is-easy').first.click()
    page.get_by_role('radio').first.click()
    assert page.get_by_role('button', name='Check answer', exact=True).is_enabled()
    assert page.locator('#practice-solution').count() == 0
    page.keyboard.press('Enter')
    page.locator('.practice-check-status').wait_for()
    assert page.locator('#practice-solution').count() == 0
    page.screenshot(path=str(output / 'sat-checked-desktop.png'))
    page.get_by_role('button', name='See solution', exact=True).click()
    page.locator('.practice-solution-content').wait_for()
    page.wait_for_timeout(350)
    page.screenshot(path=str(output / 'sat-solution-desktop.png'))
    page.reload(wait_until='networkidle')
    page.locator('.practice-check-status').wait_for()
    assert page.locator('#practice-solution').count() == 0
    page.get_by_role('button', name='All topics', exact=True).click()
    page.keyboard.press('Control+Shift+F')
    page.get_by_role('dialog', name='Jump to a question').wait_for()
    page.get_by_label('Question number', exact=True).fill('3')
    page.get_by_role('button', name='Open question', exact=True).click()
    assert 'Question 3 /' in page.locator('.hard-question-toolbar').inner_text()
    page.get_by_role('button', name='Pause timer', exact=True).click()
    page.get_by_role('heading', name='Practice paused', exact=True).wait_for()
    page.get_by_role('button', name='Continue practicing', exact=True).click()
    page.get_by_role('button', name='Math reference sheet', exact=True).click()
    page.locator('#sat-formula-sheet').wait_for()
    page.keyboard.press('Escape')

    page.goto(base + '/workspace/reading-roadmap-full-2', wait_until='networkidle')
    page.wait_for_selector('#reading-passage-pane')
    answer = page.locator('.ielts-short-answer-row input').first
    answer.fill('preserved answer')
    page.get_by_role('button', name='Notes', exact=True).click()
    page.get_by_label('Your test notes', exact=True).fill('A note that must survive Ctrl+F5.')
    page.get_by_role('button', name='Close notes', exact=True).click()

    def select_first_word():
        page.locator('#reading-passage-pane').evaluate('(pane) => pane.scrollTop = 0')
        page.locator('.ielts-reading-prose p').first.evaluate('''p => {
          const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
          let node = walker.nextNode();
          while (node && !/\\w{5,}/.test(node.textContent)) node = walker.nextNode();
          const match = node.textContent.match(/\\w{5,}/);
          const range = document.createRange(); range.setStart(node,match.index); range.setEnd(node,match.index + match[0].length);
          const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
          document.dispatchEvent(new Event('selectionchange'));
        }''')
        page.locator('[data-reading-selection-toolbar]').wait_for()

    select_first_word()
    page.get_by_role('button', name='Highlight', exact=True).click()
    mark = page.locator('.ielts-reading-prose .ielts-highlight').first
    mark.click()
    toolbar = page.locator('[data-reading-mark-toolbar]')
    toolbar.wait_for()
    target_box, tool_box = mark.bounding_box(), toolbar.bounding_box()
    assert abs(tool_box['y'] - (target_box['y'] + target_box['height'])) < 14, (target_box, tool_box)
    page.screenshot(path=str(output / 'reading-highlight-desktop.png'))
    page.get_by_role('button', name='Remove highlight', exact=True).click()
    select_first_word()
    page.get_by_role('button', name='Ask AI', exact=True).click()
    page.get_by_role('dialog').filter(has_text='AI Word Helper').wait_for()
    page.get_by_text('Evidence means facts that help show whether something is true.', exact=True).wait_for()
    page.get_by_role('dialog').get_by_role('button', name='Close', exact=True).click()
    select_first_word()
    page.get_by_role('button', name='Note', exact=True).click()
    page.get_by_role('dialog', name='Annotation note').locator('textarea').fill('Annotation attached to this word.')
    page.keyboard.press('Control+Enter')
    page.locator('.ielts-note').first.wait_for()
    page.reload(wait_until='networkidle')
    page.wait_for_selector('#reading-passage-pane')
    assert page.locator('.ielts-short-answer-row input').first.input_value() == 'preserved answer'
    assert page.locator('.ielts-note[data-note="Annotation attached to this word."]').count() > 0
    page.get_by_role('button', name='Notes', exact=True).click()
    assert page.get_by_label('Your test notes', exact=True).input_value() == 'A note that must survive Ctrl+F5.'
    page.get_by_role('button', name='Close notes', exact=True).click()
    page.screenshot(path=str(output / 'reading-questions-desktop.png'))
    page.get_by_role('button', name='Review', exact=True).click()
    page.get_by_role('dialog', name='Review your answers').wait_for()
    page.screenshot(path=str(output / 'answer-overview-desktop.png'))
    page.get_by_role('button', name='Close', exact=True).click()
    page.get_by_role('button', name='Submit', exact=True).first.click()
    page.get_by_role('button', name='Submit test', exact=True).click()
    page.get_by_role('alertdialog').wait_for()
    assert page.locator('.ir-answer-grid').count() == 0
    page.screenshot(path=str(output / 'leaderboard-notice-desktop.png'))
    page.get_by_role('button', name='OK, view results', exact=True).click()
    page.locator('.ir-answer-grid').wait_for()
    assert page.evaluate('window.lastResult.leaderboardEligible') is False

    page.goto(base + '/test/listening/ielts-listening-1?part=4', wait_until='networkidle')
    if page.get_by_role('button', name='Play', exact=True).count():
        page.get_by_role('button', name='Play', exact=True).click()
    page.locator('.ielts-listening-table').wait_for()
    assert page.locator('.ielts-listening-table input').count() == 10
    assert page.locator('.ielts-listening-table td').first.evaluate('node => parseFloat(getComputedStyle(node).fontSize)') >= 16
    page.screenshot(path=str(output / 'listening-part4-desktop.png'))
    page.goto(base + '/sat/in-process', wait_until='networkidle')
    page.locator('.in-process-card').filter(has_text='Digital SAT').get_by_role('link', name='Continue').click()
    page.get_by_role('radio').first.wait_for()
    choice = page.get_by_role('radio').nth(2)
    choice.click()
    selected_label = choice.inner_text()
    timer_before = page.get_by_title('Hide timer').inner_text().strip()
    page.wait_for_timeout(1200)
    page.reload(wait_until='networkidle')
    assert page.get_by_role('radio', checked=True).inner_text() == selected_label
    assert page.get_by_title('Hide timer').inner_text().strip() >= timer_before
    page.get_by_role('button', name='More', exact=True).click()
    page.get_by_role('button', name='Save and exit', exact=True).click()
    page.get_by_role('alertdialog').wait_for()
    page.get_by_role('button', name='Save & exit', exact=True).click()
    page.locator('.in-process-card').filter(has_text='Digital SAT').get_by_role('link', name='Continue').wait_for()
    page.screenshot(path=str(output / 'saved-tests-desktop.png'))
    page.goto(base + '/test/listening/ielts-listening-1', wait_until='networkidle')
    page.get_by_role('heading', name='You have a test in progress', exact=True).wait_for()
    page.screenshot(path=str(output / 'resume-choice-desktop.png'))
    page.get_by_role('button', name='Start a new attempt', exact=True).click()
    page.get_by_role('alertdialog').wait_for()
    page.screenshot(path=str(output / 'replace-confirmation-desktop.png'))
    page.get_by_role('button', name='Keep saved test', exact=True).click()

    page.set_viewport_size({'width': 390, 'height': 844})
    page.goto(base + '/sat/hard-questions?section=reading-writing&level=all', wait_until='networkidle')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    page.screenshot(path=str(output / 'sat-collection-mobile.png'), full_page=True)
    page.locator('.hard-tile').first.click()
    page.get_by_role('radio').first.click()
    page.get_by_role('button', name='Check answer', exact=True).click()
    page.get_by_role('button', name='See solution', exact=True).click()
    page.locator('.practice-solution-content').wait_for()
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    page.wait_for_timeout(350)
    page.screenshot(path=str(output / 'sat-solution-mobile.png'))
    page.set_viewport_size({'width':320,'height':568})
    page.goto(base + '/sat/hard-questions?section=math', wait_until='networkidle')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    page.locator('.hard-tile').first.click()
    page.locator('.hard-question').wait_for()
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    assert page.locator('.hard-test-topbar').evaluate("node => [...node.querySelectorAll('button')].every(button => { const box = button.getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth })")
    page.screenshot(path=str(output / 'sat-question-small-mobile.png'))
    page.set_viewport_size({'width':1440,'height':1000})
    page.goto(base + '/ielts/tests', wait_until='networkidle')
    tabs = page.get_by_role('tablist', name='IELTS skills')
    tabs.wait_for()
    assert tabs.evaluate('node => node.scrollWidth <= node.clientWidth + 1')
    page.screenshot(path=str(output / 'ielts-tabs-desktop.png'))
    page.set_viewport_size({'width':390,'height':844})
    assert tabs.evaluate('node => node.scrollWidth <= node.clientWidth + 1')
    page.screenshot(path=str(output / 'ielts-tabs-mobile.png'))
    page.goto(base + '/sat/hard-questions', wait_until='networkidle')
    page.set_viewport_size({'width':1440,'height':1000})
    catalog = page.evaluate('Object.fromEntries(Object.entries(window.hardRows).map(([section,rows])=>[section,rows.map(row=>row.key)]))')
    from urllib.parse import quote
    for section, keys in catalog.items():
        for index, key in enumerate(keys):
            path = '/sat/hard-questions?section=' + section + '&q=' + quote(key, safe='')
            page.evaluate("path => {history.pushState({},'',path); dispatchEvent(new PopStateEvent('popstate'))}", path)
            page.wait_for_function("number => document.querySelector('.hard-question-toolbar')?.textContent.includes('Question ' + number + ' / 100')", arg=index+1)
            assert page.locator('[data-sat-highlight-block=task]').inner_text().strip()
            page.wait_for_function("[...document.querySelectorAll('.hard-question img')].every(image=>image.complete)")
            assert page.evaluate("[...document.querySelectorAll('.hard-question img')].every(image=>image.naturalWidth>0)"), (section, index+1)
            assert page.locator('[role=radio],#student-response').count() > 0
        print('PASS: all 100 ' + section + ' questions render with their source tasks and visual assets')
    assert not errors, errors
    browser.close()
print('PASS: desktop/mobile SAT grading, hidden solutions, shortcuts, timer, reference; Reading AI, anchored highlights, notes and hard reload; Listening table; SAT hard reload/save-exit; 320px layout and tabs')
