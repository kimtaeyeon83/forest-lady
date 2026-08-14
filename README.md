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
| `vercel.json` | 사진 캐시 설정 |

## 사진 고치기

`data.js`를 직접 열어 제목이나 갈래를 바꿔도 됩니다.

```js
{ year: 2024, title: "지리산 천왕봉 등반", kind: "나들이",
  thumb: "photos/2024-cheonwang-t.jpg", full: "photos/2024-cheonwang.jpg", w: 1080, h: 1440 }
```

사진을 새로 넣을 때는 `photos/`에 큰 것과 작은 것(`-t`)을 같이 넣고 `data.js`에 한 줄 더하면 됩니다.
연도 칸은 2018년부터 올해까지 자동으로 만들어지고, 사진이 없는 해는 표시되지 않습니다.
