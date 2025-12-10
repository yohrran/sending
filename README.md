# sending

일단 무언가

## GitHub PR 자동화

이 프로젝트는 Claude Code를 사용한 로컬 GitHub PR 자동 생성 기능을 지원합니다.

### 사용 방법

**방법 A: 대화형 PR 생성**
```bash
/create-pr
```
- 현재 변경사항 확인
- 브랜치 생성 (필요시)
- 커밋 메시지 작성
- PR 생성
- 모든 단계에서 확인 가능

**방법 B: 빠른 PR 생성**
```bash
/quick-pr
```
- 자동으로 모든 변경사항 커밋
- 자동으로 브랜치 생성 (필요시)
- 자동으로 PR 생성
- 확인 단계 없이 빠르게 실행

### 필요한 도구

- [Claude Code CLI](https://docs.claude.ai/docs/claude-code) 설치
- [GitHub CLI (`gh`)](https://cli.github.com/) 설치 및 인증

### 커스텀 슬래시 커맨드

- `/create-pr` - 대화형 PR 생성 (권장)
- `/quick-pr` - 빠른 PR 생성

### 주의사항

- 생성된 PR은 항상 리뷰 후 병합하세요
- 민감한 정보(.env, credentials 등)가 포함되지 않았는지 확인하세요
