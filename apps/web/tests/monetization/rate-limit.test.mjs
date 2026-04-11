import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  enforcePartnerLeadRateLimitWithStore,
  extractClientIp,
  formatRetryAfterSeconds,
  getPartnerLeadRateLimitMessage,
} = require('../../src/lib/monetization/rate-limit-helpers.ts');

function createFakeTransaction(store) {
  const commands = [];

  const tx = {
    incr(key) {
      commands.push(() => store.incr(key));
      return tx;
    },
    expire(key, seconds, option) {
      commands.push(() => store.expire(key, seconds, option));
      return tx;
    },
    ttl(key) {
      commands.push(() => store.ttl(key));
      return tx;
    },
    async exec() {
      return commands.map((command) => command());
    },
  };

  return tx;
}

class FakeRateLimitStore {
  constructor() {
    this.now = 0;
    this.entries = new Map();
  }

  advance(seconds) {
    this.now += seconds;
  }

  multi() {
    return createFakeTransaction(this);
  }

  read(key) {
    const existing = this.entries.get(key);
    if (!existing) return null;
    if (existing.expiresAt !== null && existing.expiresAt <= this.now) {
      this.entries.delete(key);
      return null;
    }
    return existing;
  }

  incr(key) {
    const existing = this.read(key) ?? { value: 0, expiresAt: null };
    existing.value += 1;
    this.entries.set(key, existing);
    return existing.value;
  }

  expire(key, seconds, option) {
    const existing = this.read(key);
    if (!existing) return 0;
    if ((option === 'NX' || option === 'nx') && existing.expiresAt !== null) {
      return 0;
    }
    existing.expiresAt = this.now + seconds;
    this.entries.set(key, existing);
    return 1;
  }

  ttl(key) {
    const existing = this.read(key);
    if (!existing) return -2;
    if (existing.expiresAt === null) return -1;
    return Math.max(0, existing.expiresAt - this.now);
  }
}

test('Vercel 헤더를 우선 사용하고 없으면 x-forwarded-for의 첫 번째 IP를 사용한다', () => {
  const ip = extractClientIp({
    get(name) {
      if (name === 'x-vercel-forwarded-for') return '192.0.2.10';
      if (name === 'x-forwarded-for') return '198.51.100.10, 10.0.0.1';
      if (name === 'x-real-ip') return '203.0.113.20';
      return null;
    },
  });

  assert.equal(ip, '192.0.2.10');
});

test('Vercel 헤더가 없으면 x-forwarded-for의 첫 번째 IP를 사용한다', () => {
  const ip = extractClientIp({
    get(name) {
      if (name === 'x-forwarded-for') return '198.51.100.10, 10.0.0.1';
      if (name === 'x-real-ip') return '203.0.113.20';
      return null;
    },
  });

  assert.equal(ip, '198.51.100.10');
});

test('재시도 대기 시간을 자연어로 포맷한다', () => {
  assert.equal(formatRetryAfterSeconds(45), '약 45초');
  assert.equal(formatRetryAfterSeconds(90), '약 2분');
  assert.equal(formatRetryAfterSeconds(3700), '약 2시간');
});

test('제한 메시지에 재시도 시간이 포함된다', () => {
  assert.match(getPartnerLeadRateLimitMessage(120), /약 2분 후 다시 시도/);
});

test('같은 IP에서 짧은 시간 반복 제출하면 제한한다', async () => {
  const store = new FakeRateLimitStore();
  let result = { allowed: true };

  for (let index = 0; index < 5; index += 1) {
    result = await enforcePartnerLeadRateLimitWithStore(store, {
      email: `runner${index}@example.com`,
      ip: '198.51.100.10',
    });
    assert.equal(result.allowed, true);
  }

  result = await enforcePartnerLeadRateLimitWithStore(store, {
    email: 'runner-final@example.com',
    ip: '198.51.100.10',
  });

  assert.equal(result.allowed, false);
  assert.equal(result.scope, 'ip');
  assert.ok(result.retryAfterSeconds > 0);
});

test('같은 이메일 반복 제출은 IP가 달라도 제한한다', async () => {
  const store = new FakeRateLimitStore();
  let result = { allowed: true };

  for (let index = 0; index < 3; index += 1) {
    result = await enforcePartnerLeadRateLimitWithStore(store, {
      email: 'brand@example.com',
      ip: `198.51.100.${10 + index}`,
    });
    assert.equal(result.allowed, true);
  }

  result = await enforcePartnerLeadRateLimitWithStore(store, {
    email: 'brand@example.com',
    ip: '203.0.113.12',
  });

  assert.equal(result.allowed, false);
  assert.equal(result.scope, 'email');
});

test('윈도우가 지나면 다시 제출할 수 있다', async () => {
  const store = new FakeRateLimitStore();

  for (let index = 0; index < 5; index += 1) {
    await enforcePartnerLeadRateLimitWithStore(store, {
      email: `reset${index}@example.com`,
      ip: '198.51.100.77',
    });
  }

  const blocked = await enforcePartnerLeadRateLimitWithStore(store, {
    email: 'blocked@example.com',
    ip: '198.51.100.77',
  });
  assert.equal(blocked.allowed, false);

  store.advance(15 * 60 + 1);

  const reopened = await enforcePartnerLeadRateLimitWithStore(store, {
    email: 'reopened@example.com',
    ip: '198.51.100.77',
  });
  assert.equal(reopened.allowed, true);
});
