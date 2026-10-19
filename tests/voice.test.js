import test from 'node:test';
import assert from 'node:assert/strict';
import { rankVoices, scoreVoice, createVoice } from '../src/voice.js';

const v = (name, lang, localService = true, def = false) => ({ name, lang, localService, default: def });

function fakeSynth(voices = []) {
  const calls = [];
  return {
    calls,
    getVoices: () => voices,
    cancel: () => calls.push(['cancel']),
    speak: (u) => {
      calls.push(['speak', u.text]);
      queueMicrotask(() => u.onend && u.onend());
    },
  };
}
const mk = (text) => ({ text });

test('non-English voices are excluded', () => {
  assert.equal(scoreVoice(v('Thomas', 'fr-FR')), -1);
  assert.deepEqual(rankVoices([v('Thomas', 'fr-FR'), v('Kyoko', 'ja-JP')]), []);
});

test('local en-GB/en-US beat remote and other English', () => {
  const remote = v('Google US', 'en-US', false);
  const au = v('Karen', 'en-AU', true);
  const us = v('Samantha', 'en-US', true);
  const gb = v('Daniel', 'en-GB', true);
  const ranked = rankVoices([remote, au, us, gb]);
  assert.deepEqual(ranked.map((x) => x.name), ['Samantha', 'Daniel', 'Karen', 'Google US']);
});

test('enhanced/premium voices outrank plain ones; ties keep original order', () => {
  const a = v('Alex', 'en-US');
  const b = v('Ava (Premium)', 'en-US');
  assert.equal(rankVoices([a, b])[0].name, 'Ava (Premium)');
  const c = v('C', 'en-US');
  const d = v('D', 'en-US');
  assert.deepEqual(rankVoices([c, d]).map((x) => x.name), ['C', 'D']);
});

test('empty or missing list', () => {
  assert.deepEqual(rankVoices([]), []);
  assert.deepEqual(rankVoices(undefined), []);
});

test('unsupported environment is a silent no-op', async () => {
  const voice = createVoice({});
  assert.equal(voice.supported, false);
  voice.say('hi');
  voice.stop();
  voice.setMuted(true);
  await voice.sayAsync('hi'); // resolves immediately
});

test('say cancels first, picks the best voice, and sets lang', () => {
  const synth = fakeSynth([v('Karen', 'en-AU'), v('Samantha', 'en-US')]);
  const voice = createVoice({ synth, makeUtterance: mk });
  voice.say('Rock.');
  assert.deepEqual(synth.calls, [['cancel'], ['speak', 'Rock.']]);
  assert.equal(voice.voice.name, 'Samantha');
});

test('say with interrupt:false does not cancel', () => {
  const synth = fakeSynth([]);
  const voice = createVoice({ synth, makeUtterance: mk });
  voice.say('a', { interrupt: false });
  assert.deepEqual(synth.calls, [['speak', 'a']]);
});

test('mute suppresses speech and cancels what is playing', () => {
  const synth = fakeSynth([]);
  const voice = createVoice({ synth, makeUtterance: mk });
  voice.setMuted(true);
  assert.deepEqual(synth.calls, [['cancel']]);
  voice.say('nope');
  assert.deepEqual(synth.calls, [['cancel']]);
  voice.setMuted(false);
  voice.say('yes');
  assert.equal(synth.calls.at(-1)[1], 'yes');
});

test('sayAsync resolves on end', async () => {
  const synth = fakeSynth([]);
  const voice = createVoice({ synth, makeUtterance: mk });
  await voice.sayAsync('line');
  assert.deepEqual(synth.calls, [['cancel'], ['speak', 'line']]);
});

test('voices that load late are picked up via onvoiceschanged', () => {
  const list = [];
  const synth = { ...fakeSynth(list), getVoices: () => list, onvoiceschanged: null };
  const voice = createVoice({ synth, makeUtterance: mk });
  assert.equal(voice.voice, null);
  list.push(v('Samantha', 'en-US'));
  synth.onvoiceschanged();
  assert.equal(voice.voice.name, 'Samantha');
});
