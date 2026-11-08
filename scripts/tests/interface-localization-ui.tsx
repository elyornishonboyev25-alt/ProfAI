import assert from 'node:assert/strict'
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n'
import { useCopy } from '@/i18n/interface'
import { interfaceLocale } from '@/i18n/locale'
import UiText from '@/components/common/UiText'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import ExamInstruction from '@/components/common/ExamInstruction'
import AcademicSkills from '@/pages/AcademicSkills'
import LearningCenterPortal from '@/pages/LearningCenterPortal'
import { useAuthStore } from '@/store/authStore'
import { useBillingStore } from '@/features/billing/store'

function Probe() {
  const { c } = useCopy()
  const [answer, setAnswer] = useState('My original English answer: Reading')
  return <section>
    <input data-answer value={answer} onChange={event => setAnswer(event.target.value)} aria-label={c('Your answer')} placeholder={c('Type your answer...')} />
    <div data-count><UiText text="{{value1}} days to go" values={{ value1: 3 }} /></div>
    <div data-punctuation><UiText text="Answer:" /></div>
    <div data-rich><UiText text={<strong>IELTS Reading</strong>} /></div>
    <div data-role><UiText text="STUDENT" /></div>
    <div data-cached><UiText text="Javoblarni ko‘rib chiqish" /></div>
    <div data-source><ExamInstruction text="Choose ONE WORD ONLY from the passage for each answer." /></div>
  </section>
}

export async function run() {
  const root = createRoot(document.getElementById('root')!)
  const previousUser = useAuthStore.getState().user
  const previousRefresh = useBillingStore.getState().refresh
  useAuthStore.setState({ user: null })
  useBillingStore.setState({ refresh: async () => {} })
  let confirmations = 0
  try {
    await i18n.changeLanguage('en')
    await act(async () => root.render(<MemoryRouter>
      <Probe /><AcademicSkills /><LearningCenterPortal />
      <ConfirmDialog open title="Delete saved progress?" description="Your answers and notes for this unfinished test will be deleted. You will need to start it again. Completed results are kept."
        confirmLabel="Delete progress" cancelLabel="Keep test" onConfirm={() => { confirmations++ }} onClose={() => {}} />
    </MemoryRouter>))
    const expectations = {
      en: ['3 days to go', 'Answer:', 'Create class', 'Search', 'Delete progress', 'Keep test', 'en-GB', 'Review answers'],
      uz: ['3 kun qoldi', 'Javob:', 'Sinf yaratish', 'Qidirish', 'Jarayonni o‘chirish', 'Testni qoldirish', 'uz-UZ', 'Javoblarni ko‘rib chiqish'],
      ru: ['Осталось дней: 3', 'Ответ:', 'Создать класс', 'Поиск', 'Удалить прогресс', 'Оставить тест', 'ru-RU', 'Разобрать ответы'],
    }
    for (const language of ['en', 'uz', 'ru', 'en'] as const) {
      await act(async () => { await i18n.changeLanguage(language) })
      const expected = expectations[language]
      assert.equal(document.querySelector('[data-count]')?.textContent, expected[0])
      assert.equal(document.querySelector('[data-punctuation]')?.textContent, expected[1], 'colons must remain part of the interface key')
      assert.ok([...document.querySelectorAll('button')].some(button => button.textContent?.trim() === expected[2]), 'class actions translate immediately')
      const dialog = document.querySelector('[role="alertdialog"]')!
      assert.ok(dialog.textContent?.includes(expected[4]) && dialog.textContent.includes(expected[5]), 'shared dialogs translate caller-provided labels')
      assert.equal(interfaceLocale(), expected[6])
      assert.equal(document.querySelector('[data-cached]')?.textContent?.toLocaleLowerCase(), expected[7].toLocaleLowerCase(), 'cached translated interface labels follow the selected language')
      assert.equal((document.querySelector('[data-answer]') as HTMLInputElement).value, 'My original English answer: Reading', 'switching languages must preserve learner input')
      assert.equal(document.querySelector('[data-source]')?.textContent, 'Choose ONE WORD ONLY from the passage for each answer.', 'exam instructions remain verbatim')
      assert.equal(document.querySelector('[data-rich] strong')?.textContent, 'IELTS Reading', 'rich headings retain their structure')
      assert.equal(document.querySelector('[data-role]')?.textContent, language === 'uz' ? 'O‘quvchi' : language === 'ru' ? 'Ученик' : 'Student', 'server role enums use readable localized labels')
      assert.equal(document.documentElement.lang, language)
      assert.equal(localStorage.getItem('profai-language'), language)
      assert.equal(localStorage.getItem('profai-language-source'), 'user')
      for (const term of ['IELTS', 'SAT', 'Listening', 'Reading', 'Writing', 'Speaking', 'Math', 'Reading & Writing']) {
        assert.equal(i18n.t(term, { ns: 'interface', defaultValue: term }), term, 'exam names are stable')
      }
      assert.equal(i18n.t('ielts.reading'), 'Reading', 'legacy translation namespace also preserves exam names')
      assert.ok(document.querySelector('[data-source] strong'), 'source instruction emphasis remains present')
    }
    await act(async () => { (document.querySelector('.flow-dialog .is-primary') as HTMLButtonElement).click() })
    assert.equal(confirmations, 1, 'localization retains dialog actions')
    console.log('Interface localization: English, Uzbek and Russian switching, dialogs, inputs, templates, persistence and source-material integrity passed.')
  } finally {
    await act(async () => root.unmount())
    useAuthStore.setState({ user: previousUser })
    useBillingStore.setState({ refresh: previousRefresh })
  }
}
