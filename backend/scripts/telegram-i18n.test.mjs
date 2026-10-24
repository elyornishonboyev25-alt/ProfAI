import test from 'node:test'
import assert from 'node:assert/strict'
import { LANGS, detectLang, tr } from '../dist/services/telegramI18n.js'
import { DAILY_WORDS } from '../dist/services/telegramWords.js'

test('bot language follows the Telegram app language: Uzbek, Russian/CIS, otherwise English', () => {
  assert.equal(detectLang('uz'), 'uz')
  for (const code of ['ru', 'ru-RU', 'kk', 'ky', 'tg', 'tk', 'be', 'uk', 'az', 'hy']) assert.equal(detectLang(code), 'ru', code)
  for (const code of ['en', 'en-US', 'de', 'tr', 'ar', '', undefined, null]) assert.equal(detectLang(code), 'en', String(code))
})

const sample = value => typeof value === 'function'
  ? String(value(...Array.from({ length: value.length }, (_, index) => index === 0 ? { friendDays: 3, inviteeDays: 3, ladder: '-', invited: 1, qualified: 1, earned: 3, link: 'x' } : 2)))
  : typeof value === 'object' ? Object.values(value).join(' ') : String(value)

test('every message exists in all three languages and is written in that language', () => {
  const keys = Object.keys(tr('uz')).sort()
  for (const lang of LANGS) {
    const messages = tr(lang)
    assert.deepEqual(Object.keys(messages).sort(), keys, lang)
    for (const key of keys) {
      const text = sample(messages[key])
      assert.ok(text.trim().length > 0, `${lang}.${key} is empty`)
      if (lang !== 'ru') assert.equal(/[А-Яа-яЁё]/.test(text), false, `${lang}.${key} contains Cyrillic`)
    }
  }
  assert.ok(/[А-Яа-я]/.test(tr('ru').help) && /[А-Яа-я]/.test(tr('ru').startBody))
  assert.notEqual(tr('en').startBody, tr('uz').startBody)
})

test('bot profile texts fit Telegram limits', () => {
  for (const lang of LANGS) {
    const messages = tr(lang)
    assert.ok(messages.description.length <= 512, `${lang} description`)
    assert.ok(messages.shortDescription.length <= 120, `${lang} short description`)
    for (const description of Object.values(messages.commands)) assert.ok(description.length >= 3 && description.length <= 256)
  }
})

test('every daily word has an Uzbek and Russian translation and an English definition', () => {
  for (const word of DAILY_WORDS) {
    assert.ok(word.uz && word.ru && word.en, word.word)
    assert.ok(/[А-Яа-я]/.test(word.ru), `${word.word} ru`)
  }
})
