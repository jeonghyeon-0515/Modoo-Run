function decodeRoadrunHtml(input) {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof Uint8Array || Buffer.isBuffer(input)) {
    return new TextDecoder("euc-kr").decode(input);
  }

  throw new TypeError("Roadrun HTML은 문자열 또는 바이트 배열이어야 합니다.");
}

function stripTags(value) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirstMatch(source, pattern) {
  const match = source.match(pattern);
  return match ? match[1] : null;
}

function parseRoadrunList(input) {
  const html = decodeRoadrunHtml(input);
  const rowPattern = /<tr>\s*<td width="18%">[\s\S]*?<font size="4"[^>]*>([^<]+)<\/font><\/b><br><font color="#959595">\(([^)]+)\)<\/font>[\s\S]*?<td width="29%"><b><font[^>]*><a href="javascript:open_window\('win', 'view\.php\?no=(\d+)'[^>]*>([^<]+)<\/a><br><font[^>]*>([^<]*)<\/font>[\s\S]*?<td width="19%">\s*<div align="center">([\s\S]*?)<\/div>[\s\S]*?<td width="30%">\s*<div align="right" valign="bottom">([\s\S]*?)<br>\s*☎([^<]+)<br>[\s\S]*?<\/tr>/g;

  const races = [];
  let match = rowPattern.exec(html);

  while (match) {
    races.push({
      sourceRaceId: match[3],
      dateLabel: match[1],
      weekday: match[2],
      title: stripTags(match[4]),
      courseSummary: stripTags(match[5]),
      location: stripTags(match[6]),
      organizer: stripTags(match[7]),
      phone: stripTags(match[8]),
      detailPath: `/schedule/view.php?no=${match[3]}`,
    });
    match = rowPattern.exec(html);
  }

  return races;
}

function extractDetailField(html, label) {
  const pattern = new RegExp(
    `<p align="center">${label}<\\/p>[\\s\\S]*?<td[^>]*bgcolor="white"[^>]*>([\\s\\S]*?)<\\/td>`,
    "i",
  );

  return stripTags(extractFirstMatch(html, pattern) ?? "");
}

function parseRoadrunDetail(input) {
  const html = decodeRoadrunHtml(input);
  const homepageHref = extractFirstMatch(html, /<p>http:\/\/<a href="(http[^"]+)" target="_new">/i);

  return {
    title: extractDetailField(html, "대회명"),
    representativeName: extractDetailField(html, "대표자명"),
    schedule: extractDetailField(html, "대회일시"),
    phone: extractDetailField(html, "전화번호"),
    courseSummary: extractDetailField(html, "대회종목"),
    region: extractDetailField(html, "대회지역"),
    location: extractDetailField(html, "대회장소"),
    organizer: extractDetailField(html, "주최단체"),
    registrationPeriod: extractDetailField(html, "접수기간"),
    homepage: homepageHref ?? "",
    introduction: extractDetailField(html, "기타소개"),
  };
}

module.exports = {
  decodeRoadrunHtml,
  parseRoadrunList,
  parseRoadrunDetail,
  stripTags,
};
