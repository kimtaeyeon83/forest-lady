// 사이트에서 고친 내용을 깃허브에 반영합니다.
// Vercel이 그 커밋을 보고 자동으로 다시 배포하므로, 링크를 받은 모두가 같은 내용을 봅니다.
//
// Vercel 프로젝트에 아래 두 가지를 넣어두어야 동작합니다 (Settings → Environment Variables).
//   GITHUB_TOKEN   : forest-lady 저장소에 Contents 읽기/쓰기 권한이 있는 토큰
//   EDIT_PASSWORD  : 고칠 때 물어보는 암호 (직접 정하시면 됩니다)

const REPO = process.env.GITHUB_REPO || 'kimtaeyeon83/forest-lady';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const API = 'https://api.github.com';

function ghHeaders(token) {
  return {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'forest-lady-site'
  };
}

async function getSha(token, path) {
  const url = `${API}/repos/${REPO}/contents/${encodeURI(path)}?ref=${BRANCH}`;
  const r = await fetch(url, { headers: ghHeaders(token) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`깃허브에서 ${path} 를 읽지 못했습니다 (${r.status})`);
  const j = await r.json();
  return j.sha || null;
}

async function putFile(token, path, contentB64, message) {
  const sha = await getSha(token, path);
  const body = { message, content: contentB64, branch: BRANCH };
  if (sha) body.sha = sha;

  const r = await fetch(`${API}/repos/${REPO}/contents/${encodeURI(path)}`, {
    method: 'PUT',
    headers: ghHeaders(token),
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`${path} 저장 실패 (${r.status}) ${t.slice(0, 200)}`);
  }
  return r.json();
}

function renderDataJs(photos) {
  const lines = photos.map(function (p) {
    return '  { id: ' + JSON.stringify(p.id) +
      ', year: ' + Number(p.year) +
      ', title: ' + JSON.stringify(p.title || '') +
      ', kind: ' + JSON.stringify(p.kind || '') +
      ', thumb: ' + JSON.stringify(p.thumb) +
      ', full: ' + JSON.stringify(p.full) +
      ', w: ' + Number(p.w || 0) +
      ', h: ' + Number(p.h || 0) + ' }';
  });
  return '// 사이트의 「고치기」에서 저장됩니다. 직접 고쳐도 됩니다.\n' +
    'window.PHOTOS = [\n' + lines.join(',\n') + '\n];\n';
}

function safeName(s) {
  return String(s || '').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 60) || 'photo';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST 로만 받습니다.' });
  }

  const token = process.env.GITHUB_TOKEN;
  const pass = process.env.EDIT_PASSWORD;
  if (!token || !pass) {
    return res.status(500).json({
      error: '서버에 GITHUB_TOKEN 과 EDIT_PASSWORD 가 아직 설정되지 않았습니다. Vercel 프로젝트 설정에서 넣어주세요.'
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body) return res.status(400).json({ error: '내용을 읽지 못했습니다.' });

  if (body.password !== pass) {
    await new Promise(function (r) { setTimeout(r, 700); });   // 무차별 시도 늦추기
    return res.status(401).json({ error: '암호가 맞지 않습니다.' });
  }

  const photos = body.photos;
  if (!Array.isArray(photos) || !photos.length) {
    return res.status(400).json({ error: '사진 목록이 비어 있습니다.' });
  }

  try {
    const out = [];
    let uploaded = 0;

    for (const p of photos) {
      const row = {
        id: p.id, year: p.year, title: p.title, kind: p.kind,
        thumb: p.thumb, full: p.full, w: p.w, h: p.h
      };

      // 새로 추가한 사진이면 파일부터 저장소에 올립니다
      if (p.upload && p.upload.base64) {
        const name = safeName(p.id) + '.jpg';
        const path = 'photos/' + name;
        await putFile(token, path, p.upload.base64, '사진 추가: ' + name);
        row.thumb = path;
        row.full = path;
        uploaded++;
      }

      if (!row.thumb || !row.full) {
        return res.status(400).json({ error: `사진 파일 경로가 없습니다: ${row.id}` });
      }
      out.push(row);
    }

    const js = renderDataJs(out);
    await putFile(
      token,
      'data.js',
      Buffer.from(js, 'utf8').toString('base64'),
      `사진 정보 수정 (${out.length}장${uploaded ? `, 새 사진 ${uploaded}장` : ''})`
    );

    return res.status(200).json({ ok: true, count: out.length, uploaded, photos: out });
  } catch (err) {
    return res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
};
