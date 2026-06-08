// 시드 콘텐츠 데이터. 코드 로직과 분리.
// 제약: 제목≤30, 본문≤300, 댓글≤200, birthYear≤1976.

export const personas = [
  { idx: 1,  nickname: '텃밭지기',   name: '김순자', birthYear: 1958, birthMonth: 3,  birthDay: 12 },
  { idx: 2,  nickname: '새벽산책',   name: '박영호', birthYear: 1962, birthMonth: 7,  birthDay: 5  },
  { idx: 3,  nickname: '장미여사',   name: '이정숙', birthYear: 1965, birthMonth: 11, birthDay: 23 },
  { idx: 4,  nickname: '백두산',     name: '최강식', birthYear: 1955, birthMonth: 1,  birthDay: 9  },
  { idx: 5,  nickname: '책읽는노을', name: '정미경', birthYear: 1968, birthMonth: 4,  birthDay: 17 },
  { idx: 6,  nickname: '손맛집사',   name: '한복례', birthYear: 1960, birthMonth: 9,  birthDay: 2  },
  { idx: 7,  nickname: '소소한행복', name: '오태원', birthYear: 1963, birthMonth: 6,  birthDay: 28 },
  { idx: 8,  nickname: '들꽃향기',   name: '윤경애', birthYear: 1970, birthMonth: 8,  birthDay: 14 },
  { idx: 9,  nickname: '뚜벅이영감', name: '서병철', birthYear: 1957, birthMonth: 12, birthDay: 1  },
  { idx: 10, nickname: '가을하늘',   name: '문선희', birthYear: 1966, birthMonth: 10, birthDay: 30 },
  { idx: 11, nickname: '아침이슬',   name: '강옥분', birthYear: 1959, birthMonth: 2,  birthDay: 19 },
  { idx: 12, nickname: '느림보걸음', name: '임재근', birthYear: 1973, birthMonth: 5,  birthDay: 8  },
];

export function emailFor(idx) {
  return `seed${String(idx).padStart(2, '0')}@seed.bloom`;
}

// photo: photos/ 안 파일명. 없으면 null.
// WALK 8, COOKING 8, GARDENING 8, READING 6, EXERCISE 6, MEETING 4 = 40개
export const checkins = [
  // ===== GARDENING 8 =====
  { authorIdx: 1, category: 'GARDENING', title: '상추가 이만큼 자랐어요',
    description: '아침에 텃밭 나가보니 상추가 제법 컸네요.\n오늘 저녁은 삼겹살에 쌈으로 먹어야겠어요 ㅎㅎ\n비온 뒤라 그런지 쑥쑥 자랍니다~', photo: 'gardening-01.jpg' },

  { authorIdx: 3, category: 'GARDENING', title: '장미가 활짝 폈네요',
    description: '올해는 유난히 색이 곱게 폈어요.\n지나가는 분들이 다 한 번씩 보고 가시네요^^\n주식보다 수익난 우리집 장미들 ㅎㅎ', photo: 'gardening-02.jpg' },

  { authorIdx: 1, category: 'GARDENING', title: '방울토마토 첫 수확!',
    description: '드디어 빨갛게 익었어요.\n첫 수확이라 그런지 더 맛있는 것 같아요.\n손자한테 보내줬더니 맛있다고 엄지척 ㅎㅎ', photo: 'gardening-03.jpg' },

  { authorIdx: 8, category: 'GARDENING', title: '베란다 텃밭 근황이에요',
    description: '고추, 깻잎, 바질을 키우고 있어요.\n이 정도면 제법 그럴싸하지요?^^\n햇빛이 잘 드니까 쑥쑥 크는 것 같아요.', photo: null },

  { authorIdx: 11, category: 'GARDENING', title: '오이가 주렁주렁 달렸어요',
    description: '올 여름 오이 풍년이에요.\n이웃들한테도 나눠줬는데 좋아하시더라고요.\n심는 보람이 있네요~', photo: 'gardening-04.jpg' },

  { authorIdx: 1, category: 'GARDENING', title: '가을 텃밭 정리했어요',
    description: '여름 작물 다 걷어내고 김장 배추 심었어요.\n텃밭 정리하고 나면 이상하게 마음도 정리되는 것 같아요.\n내년에 또 열심히 해야겠어요^^', photo: null },

  { authorIdx: 3, category: 'GARDENING', title: '허브 화분 들여놓았어요',
    description: '로즈마리랑 민트를 키워보려고요.\n향기가 너무 좋아서 매일 한 번씩 만져봐요 ㅎㅎ\n요리할 때 쓸 수 있으면 좋겠어요.', photo: null },

  { authorIdx: 8, category: 'GARDENING', title: '씨앗부터 키운 고추예요',
    description: '3월에 씨앗 뿌려서 드디어 빨갛게 익었어요.\n이렇게 오래 걸릴 줄은 몰랐는데…\n그래도 직접 키워서 더 뿌듯합니다^^', photo: 'gardening-05.jpg' },

  // ===== COOKING 8 =====
  { authorIdx: 6, category: 'COOKING', title: '건강 비빔밥 차려봤어요',
    description: '나물 몇 가지 무쳐서 비빔밥 했어요.\n색깔도 곱고 먹으니 속이 편하네요^^\n나이 드니 이런 소박한 밥이 제일입니다.', photo: 'cooking-01.jpg' },

  { authorIdx: 6, category: 'COOKING', title: '된장찌개 끓였어요',
    description: '텃밭에서 딴 호박이랑 두부 넣고 된장찌개 끓였어요.\n집된장이라 그런지 깊은 맛이 나네요.\n밥 두 공기 뚝딱했습니다 ㅎㅎ', photo: null },

  { authorIdx: 10, category: 'COOKING', title: '갈비찜 성공이에요',
    description: '딸이 좋아한다고 갈비찜 도전해봤어요.\n처음치고는 꽤 잘 됐다 싶었는데 딸도 맛있다고 해서 뿌듯했어요^^\n다음엔 더 잘 할 수 있을 것 같아요.', photo: 'cooking-02.jpg' },

  { authorIdx: 6, category: 'COOKING', title: '겉절이 담갔어요',
    description: '시장에서 봄배추 사다가 겉절이 담갔어요.\n바로 무쳐 먹으니 아삭아삭 맛있네요.\n이웃에도 조금 나눠줬습니다^^', photo: null },

  { authorIdx: 11, category: 'COOKING', title: '잡채 만들어봤어요',
    description: '오늘 손자 왔길래 잡채 만들었어요.\n당면 불리고 나물 볶고 하다 보니 두 시간이 훌쩍 지나갔네요 ㅎㅎ\n먹는 모습 보니 힘 안 드네요.', photo: 'cooking-03.jpg' },

  { authorIdx: 10, category: 'COOKING', title: '수제비 끓였어요',
    description: '비 오는 날엔 수제비지요.\n반죽을 얇게 뜯는 게 포인트예요.\n남편이 어머니 것보다 맛있다고 해서 기분 좋았어요 ㅎㅎ', photo: null },

  { authorIdx: 6, category: 'COOKING', title: '고등어구이 해먹었어요',
    description: '시장에서 고등어 한 손 사다 구웠어요.\n무조림이랑 시금치나물 곁들이니 밥 한 공기 더 먹었네요.\n간단한 게 제일 맛있어요^^', photo: null },

  { authorIdx: 11, category: 'COOKING', title: '전 부쳐서 나눠줬어요',
    description: '부추전이랑 김치전 잔뜩 부쳐서 위아래 집에 나눠줬어요.\n받으신 분들이 너무 좋아하셔서 저도 기분이 좋았어요.\n나눠 먹는 게 제일 맛있는 것 같아요^^', photo: 'cooking-04.jpg' },

  // ===== WALK 8 =====
  { authorIdx: 2, category: 'WALK', title: '새벽 공원 한 바퀴',
    description: '오늘도 다섯 시에 눈이 떠져서 공원 다녀왔어요.\n공기가 어찌나 좋던지…\n걷고 나면 하루가 가벼워집니다.', photo: null },

  { authorIdx: 9, category: 'WALK', title: '강변 따라 걸었어요',
    description: '날이 선선해서 강변을 한참 걸었습니다.\n물 흐르는 소리 들으며 걸으니 마음이 편하네요.\n이런 게 행복이지 싶어요.', photo: 'walk-01.jpg' },

  { authorIdx: 2, category: 'WALK', title: '동네 한 바퀴 돌았어요',
    description: '저녁 먹고 소화시킬 겸 동네 한 바퀴 돌았어요.\n골목골목 보면서 걷다 보니 새로 생긴 꽃가게도 있고…\n걷는 것 만큼 좋은 운동이 없는 것 같아요.', photo: null },

  { authorIdx: 12, category: 'WALK', title: '국화꽃 향기 맡으며',
    description: '공원에 국화축제 하길래 다녀왔어요.\n향기가 진해서 한참 서 있었네요.\n가을이 깊어가는 것 같아서 마음이 싱숭생숭했어요^^', photo: 'walk-02.jpg' },

  { authorIdx: 9, category: 'WALK', title: '비온 뒤 공원 산책',
    description: '비 그치고 나서 공원에 나갔는데 공기가 너무 좋더라고요.\n젖은 땅 밟는 느낌도 좋고…\n한 시간 넘게 걸었네요 ㅎㅎ', photo: null },

  { authorIdx: 2, category: 'WALK', title: '아파트 뒷산 올랐어요',
    description: '날 좋아서 아파트 뒤 야트막한 산 올랐어요.\n정상에서 동네 내려다보니 기분이 새로워요.\n땀 흘리고 나면 상쾌하네요~', photo: null },

  { authorIdx: 12, category: 'WALK', title: '공원에서 커피 한 잔',
    description: '커피 테이크아웃해서 공원 벤치에 앉아 마셨어요.\n아무것도 안 하고 그냥 앉아만 있었는데 그게 제일 좋았어요.\n이런 여유가 생기니 살 것 같아요 ㅎㅎ', photo: 'walk-03.jpg' },

  { authorIdx: 9, category: 'WALK', title: '시장 구경 다녀왔어요',
    description: '재래시장 구경 다녀왔어요.\n살 것도 없는데 이상하게 시장은 가면 기분이 좋아져요.\n어묵 한 꼬치 먹고 왔네요 ㅎㅎ', photo: null },

  // ===== EXERCISE 6 =====
  { authorIdx: 4, category: 'EXERCISE', title: '뒷산 등산 다녀왔습니다',
    description: '오랜만에 친구들이랑 뒷산 올랐어요.\n정상에서 마시는 막걸리 한 잔이 꿀맛이네요 ㅎㅎ\n다리는 좀 뻐근해도 기분은 최고입니다.', photo: 'exercise-01.jpg' },

  { authorIdx: 4, category: 'EXERCISE', title: '수영 한 시간 했어요',
    description: '구청 수영장 등록하고 오늘 처음 갔어요.\n한 시간 했더니 온몸이 개운하네요.\n계속 다닐 수 있을지 모르겠지만 일단 해봐야죠^^', photo: null },

  { authorIdx: 7, category: 'EXERCISE', title: '스트레칭 습관 들이는 중',
    description: '매일 아침 20분씩 스트레칭 하기로 했어요.\n2주째 빠지지 않고 있어요 ㅎㅎ\n몸이 조금씩 가벼워지는 것 같아서 신기해요.', photo: null },

  { authorIdx: 4, category: 'EXERCISE', title: '헬스장 등록했어요',
    description: '드디어 용기 내서 헬스장 등록했어요.\n트레이너분이 친절하게 가르쳐 주셔서 잘 따라했어요.\n꾸준히 하면 좋겠는데… 의지가 관건이네요 ㅎㅎ', photo: null },

  { authorIdx: 7, category: 'EXERCISE', title: '자전거 타고 왔어요',
    description: '한강 따라 자전거 두 시간 탔어요.\n바람 맞으며 달리니 스트레스가 확 풀리더라고요.\n자전거가 이렇게 좋은 운동인지 몰랐어요^^ ', photo: 'exercise-02.jpg' },

  { authorIdx: 7, category: 'EXERCISE', title: '배드민턴 배워봐요',
    description: '동네 배드민턴 동호회에 들어갔어요.\n처음엔 공도 못 쳤는데 이제 조금씩 맞더라고요 ㅎㅎ\n새로운 걸 배우는 게 이렇게 재미있을 줄이야.', photo: null },

  // ===== READING 6 =====
  { authorIdx: 5, category: 'READING', title: '요즘 읽는 책 한 권',
    description: '도서관에서 빌려온 소설을 읽고 있어요.\n나이 들어 읽으니 또 다르게 다가오네요.\n노을 보며 한 장씩 넘기는 재미가 쏠쏠합니다.', photo: null },

  { authorIdx: 5, category: 'READING', title: '도서관 다녀왔어요',
    description: '오랜만에 도서관에 갔더니 새 책들이 많이 들어왔더라고요.\n세 권 빌려 왔어요.\n다 읽을 수 있을지 모르겠지만 ㅎㅎ', photo: 'reading-01.jpg' },

  { authorIdx: 10, category: 'READING', title: '역사 소설에 빠졌어요',
    description: '역사 소설 읽기 시작했는데 이게 너무 재미있네요.\n잠도 못 자고 읽다가 남편한테 혼났어요 ㅎㅎ\n다음 권이 기다려져요~', photo: null },

  { authorIdx: 5, category: 'READING', title: '독서 모임 다녀왔어요',
    description: '한 달에 한 번 독서 모임 다녀왔어요.\n같은 책을 읽어도 다들 느끼는 게 달라서 재미있어요.\n오늘은 제 이야기에 모두들 공감해줘서 기분 좋았어요^^', photo: null },

  { authorIdx: 10, category: 'READING', title: '시집 한 권 샀어요',
    description: '서점에서 시집 한 권 사왔어요.\n시는 오래간만이라 어색했는데 읽다 보니 좋은 구절들이 많네요.\n밑줄 그어가며 읽고 있어요~', photo: 'reading-02.jpg' },

  { authorIdx: 5, category: 'READING', title: '손자랑 그림책 읽었어요',
    description: '손자가 놀러 와서 같이 그림책 읽었어요.\n아이 눈높이에서 읽어주다 보니 저도 동심으로 돌아간 것 같았어요.\n이런 시간이 참 소중하네요^^', photo: null },

  // ===== MEETING 4 =====
  { authorIdx: 7, category: 'MEETING', title: '오랜 친구들과 점심',
    description: '동창들 모여서 칼국수 한 그릇 했어요.\n수십 년 친구들이라 말 안 해도 통하네요 ㅎㅎ\n다음 달에 또 보기로 했습니다.', photo: 'meeting-01.jpg' },

  { authorIdx: 12, category: 'MEETING', title: '동네 모임 나갔어요',
    description: '반상회에서 만난 이웃들이랑 다 같이 점심 먹었어요.\n나이대가 비슷하다 보니 말이 잘 통해요.\n동네에서 이런 모임이 생겨서 좋네요^^', photo: null },

  { authorIdx: 7, category: 'MEETING', title: '동창회 다녀왔어요',
    description: '10년 만에 동창회 나갔더니 다들 많이 변했더라고요.\n그래도 오래된 친구라 금방 예전처럼 얘기하게 되더라고요.\n더 자주 보자 했는데… 그게 말처럼 쉽지가 않아요 ㅎㅎ', photo: 'meeting-02.jpg' },

  { authorIdx: 12, category: 'MEETING', title: '취미 동호회 첫 모임',
    description: '사진 찍기 좋아해서 동호회에 가입했어요.\n첫 모임에 갔더니 다들 친절하게 맞아줘서 다행이었어요.\n다음 달 출사도 기대됩니다~', photo: null },
];

// 카테고리별 댓글 후보. 어미는 5060 톤 유지.
export const commentPool = {
  GARDENING: ['어머 잘 키우셨네요^^', '저도 텃밭 하는데 부럽습니다 ㅎㅎ', '색이 참 곱네요~', '정성이 느껴져요.', '저도 따라 해보고 싶어요!'],
  COOKING:   ['보기만 해도 군침이 도네요 ㅎㅎ', '솜씨가 좋으십니다^^', '건강한 밥상이네요~', '저도 따라 해봐야겠어요.', '맛있겠다~'],
  WALK:      ['저도 아침 산책 좋아해요^^', '공기 좋았겠어요~', '걷는 게 최고지요 ㅎㅎ', '사진만 봐도 시원하네요.', '저도 같이 걷고 싶네요~'],
  EXERCISE:  ['대단하십니다 ㅎㅎ', '저질 체력이라 부럽네요^^', '건강이 최고지요~', '막걸리 한 잔 생각나네요 ㅎㅎ', '꾸준히 하시는 모습 멋져요~'],
  READING:   ['무슨 책인지 궁금하네요^^', '저도 요즘 책 읽어요~', '노을 보며 읽으니 좋겠어요.', '추천 좀 해주세요 ㅎㅎ', '책 읽는 모습이 참 좋아요.'],
  MEETING:   ['보기 좋습니다^^', '오랜 친구가 최고지요~', '저도 친구들 보고 싶네요 ㅎㅎ', '즐거우셨겠어요.', '자주 보세요~'],
};

// 대댓글용 짧은 반응
export const replyPool = ['맞아요 ㅎㅎ', '감사합니다^^', '그러게요~', '담에 같이 해요^^', '좋은 말씀이에요~'];
