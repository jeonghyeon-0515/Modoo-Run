import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parseRoadrunList, parseRoadrunDetail } = require("../../src/lib/races/source/roadrun.js");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, "../fixtures/raw");

function readFixture(name) {
  return fs.readFileSync(path.join(fixturesDir, name));
}

test("Roadrun 목록 fixture에서 접수중 대회 목록을 파싱한다", () => {
  const races = parseRoadrunList(readFixture("roadrun-list-open.html"));

  assert.ok(races.length > 200, "대회 개수가 충분히 많아야 한다");
  assert.deepEqual(races[0], {
    sourceRaceId: "41182",
    dateLabel: "1/1",
    weekday: "목",
    title: "2026 새해 일출런",
    courseSummary: "10km,5km",
    location: "신정교하부육상트랙구장",
    organizer: "(사)대한생활체육마라톤협회",
    phone: "00-1644-4219",
    detailPath: "/schedule/view.php?no=41182",
  });
});

test("Roadrun 상세 fixture에서 핵심 필드를 파싱한다", () => {
  const detail = parseRoadrunDetail(readFixture("roadrun-detail-41469.html"));

  assert.equal(detail.title, "2026 글로컬 건양대학교 K-국방 마라톤");
  assert.equal(detail.representativeName, "김동균");
  assert.equal(detail.schedule, "2026년4월4일 출발시간:오전 9시 00분");
  assert.equal(detail.phone, "1600-3962");
  assert.equal(detail.courseSummary, "하프,10km,5km");
  assert.equal(detail.region, "충남");
  assert.equal(detail.location, "건양대학교 글로컬캠퍼스 대운동");
  assert.equal(detail.organizer, "건양대학교");
  assert.equal(detail.registrationPeriod, "2026년3월13일~2026년3월18일");
  assert.equal(detail.homepage, "http://kyrun.co.kr/");
  assert.match(detail.introduction, /건양대학생/);
});
