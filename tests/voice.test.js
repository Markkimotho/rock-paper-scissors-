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

test('novelty and legacy voices are never chosen, even when listed first', () => {
  const list = [v('Albert', 'en-US'), v('Bad News', 'en-US'), v('Fred', 'en-US'), v('Zarvox', 'en-US'), v('Samantha', 'en-US')];
  assert.deepEqual(rankVoices(list).map((x) => x.name), ['Samantha']);
  const only = [v('Albert', 'en-US'), v('Bells', 'en-US')];
  assert.deepEqual(rankVoices(only), []);
});

test('premium and natural voices beat the classic ones', () => {
  const list = [v('Samantha', 'en-US'), v('Ava (Premium)', 'en-US'), v('Microsoft Aria Online (Natural) - English (United States)', 'en-US', false)];
  const names = rankVoices(list).map((x) => x.name);
  assert.equal(names[0], 'Ava (Premium)');
  assert.ok(names.indexOf('Samantha') < names.length);
});

test('say passes pitch and rate through to the utterance', () => {
  const spoken = [];
  const synth = { ...fakeSynth([]), speak: (u) => spoken.push(u) };
  const voice = createVoice({ synth, makeUtterance: mk });
  voice.say('Shoot!', { pitch: 1.3, rate: 1.1 });
  voice.say('plain');
  assert.equal(spoken[0].pitch, 1.3);
  assert.equal(spoken[0].rate, 1.1);
  assert.equal(spoken[1].pitch, 1);
  assert.equal(spoken[1].rate, 1);
});

test('preferred voice wins when installed, and falls back when it is not', () => {
  const list = [v('Samantha', 'en-US'), v('Daniel', 'en-GB')];
  assert.equal(createVoice({ synth: fakeSynth(list), makeUtterance: mk, preferred: 'Daniel' }).voice.name, 'Daniel');
  assert.equal(createVoice({ synth: fakeSynth(list), makeUtterance: mk, preferred: 'Gone' }).voice.name, 'Samantha');
});

test('next() cycles through distinct voices, wraps, and reports changes', () => {
  const list = [v('Samantha', 'en-US'), v('Daniel', 'en-GB'), v('Daniel', 'en-GB'), v('Karen', 'en-AU')];
  const seen = [];
  const voice = createVoice({ synth: fakeSynth(list), makeUtterance: mk, onChange: (x, all) => seen.push([x.name, all.length]) });
  assert.equal(voice.candidates.length, 3, 'duplicate names collapse');
  const order = [voice.voice.name, voice.next().name, voice.next().name, voice.next().name];
  assert.equal(order[3], order[0], 'wraps');
  assert.equal(new Set(order.slice(0, 3)).size, 3);
  assert.deepEqual(seen[0], [order[0], 3]);
});

test('next() with no voices is null', () => {
  assert.equal(createVoice({ synth: fakeSynth([]), makeUtterance: mk }).next(), null);
});
