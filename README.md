# 포레스트 레이디

태연 · 은윤 · 유선 · 수진, 2018년부터의 기록. 연도별 사진 그리드.

빌드 단계가 없는 **정적 사이트**입니다. Vercel이 그대로 배포합니다.

## 올리는 법

### 1) 웹에서 끌어다 놓기 — 가장 쉬움

1. <https://vercel.com> 가입 (GitHub 계정으로 바로 됩니다)
2. 새 프로젝트 → **Deploy** 화면에서 이 폴더를 통째로 끌어다 놓기
3. 프레임워크는 **Other**, 빌드 명령은 비워둡니다

### 2) 명령어로 올리기

Node.js가 설치돼 있어야 합니다.

```bash
npx vercel
```

처음 한 번만 로그인하면 되고, 이후에는 아래로 새로 올립니다.

```bash
npx vercel --prod
```

### 3) GitHub 연결 — 계속 고칠 거라면 추천

```bash
git init
git add .
git commit -m "포레스트 레이디 첫 배포"
git branch -M main
git remote add origin <내 저장소 주소>
git push -u origin main
```

그 다음 Vercel에서 저장소를 연결하면, 앞으로는 `git push` 할 때마다 사이트가 자동으로 새로 올라갑니다.

## 파일

| 파일 | 하는 일 |
|---|---|
| `index.html` | 페이지 뼈대 |
| `style.css` | 색·글꼴·그리드 |
| `app.js` | 그리드 그리기, 갈래 거르기, 사진 크게 보기 |
| `data.js` | 사진 목록 (연도 · 제목 · 갈래 · 파일 경로) |
| `photos/` | 사진. `-t.jpg`는 그리드용 작은 것, 나머지는 크게 볼 때 쓰는 것 |
| `api/save.js` | 고친 내용을 깃허브에 저장하는 서버 함수 |
| `vercel.json` | 사진 캐시 설정 |

## 처음 한 번만 — 고치기 켜기

사이트에서 고친 내용을 **모두에게 보이게** 하려면 Vercel에 두 가지를 넣어야 합니다.
넣기 전에는 고치기는 되지만 그 브라우저에만 남습니다.

**1) 깃허브 토큰 만들기**

<https://github.com/settings/personal-access-tokens/new> 에서 **Fine-grained token**을 만듭니다.

- Repository access → **Only select repositories** → `forest-lady`
- Permissions → Repository permissions → **Contents: Read and write**
- 만료일은 원하는 대로 (1년 권장)

만들면 `github_pat_...` 로 시작하는 값이 한 번만 보입니다. 복사해 두세요.

**2) Vercel에 넣기**

Vercel → `forest-lady` 프로젝트 → **Settings → Environment Variables** 에서 두 개를 추가합니다.

| 이름 | 값 |
|---|---|
| `GITHUB_TOKEN` | 위에서 복사한 토큰 |
| `EDIT_PASSWORD` | 고칠 때 물어볼 암호 (직접 정하세요) |

넣은 뒤 **Deployments → 맨 위 배포 → Redeploy** 를 한 번 눌러야 적용됩니다.

> 토큰과 암호는 Vercel 서버에만 있고 사이트 화면에는 나오지 않습니다.
> 암호를 아는 사람만 고칠 수 있으니, 넷이서 쓸 암호 하나를 정해 공유하시면 됩니다.

## 사이트에서 바로 고치기

사이트 위쪽 **「고치기」** 를 누르면 사진마다 **제목 · 연도 · 갈래**를 그 자리에서 바꿀 수 있습니다.
갈래 목록에서 **「＋ 새 갈래…」** 를 고르면 갈래를 새로 만들 수 있고, **「빼기」** 로 사진을 목록에서 뺄 수 있습니다.
**「사진 추가」** 로 새 사진을 넣거나, 사진 파일을 화면에 끌어다 놓아도 됩니다.

고친 내용은 먼저 **그 브라우저에만** 저장됩니다.
**「사이트에 반영」** 을 누르고 암호를 넣으면 깃허브에 저장되고, Vercel이 다시 올려 **1분쯤 뒤 모두에게 같은 내용이 보입니다.**

**「처음 상태로」** 는 아직 반영하지 않은 수정을 모두 버립니다.
**「내보내기」** 는 고친 내용을 `forest-lady-edits.json` 파일로 받아둡니다 (백업용).

## data.js 직접 고치기

`data.js`를 열어 제목이나 갈래를 바꿔도 됩니다.

```js
{ id: "2024-cheonwang", year: 2024, title: "지리산 천왕봉 등반", kind: "나들이",
  thumb: "photos/2024-cheonwang-t.jpg", full: "photos/2024-cheonwang.jpg", w: 1080, h: 1440 }
```

`id`는 사진마다 하나씩인 이름표입니다. 사이트에서 고친 내용이 이 `id`에 붙으니 바꾸지 마세요.

사진을 새로 넣을 때는 `photos/`에 큰 것과 작은 것(`-t`)을 같이 넣고 `data.js`에 한 줄 더하면 됩니다.
연도 칸은 2018년부터 올해까지 자동으로 만들어지고, 사진이 없는 해는 표시되지 않습니다.
