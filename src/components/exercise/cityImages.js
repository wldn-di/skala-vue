export const CITY_IMAGE_BY_ID = {
  seoul: 'seoul.png',
  busan: 'busan.png',
  daegu: 'daegu.png',
  incheon: 'incheon.png',
  gwangju: 'gyangju.png',
  daejeon: 'daejeun.png',
  ulsan: 'ulsan.png',
  sejong: 'sejong.png',
  gyeonggi: 'gyeongji.png',
  gangwon: 'gangwon.png',
  chungbuk: 'choongcheong_north.png',
  chungnam: 'choongcheong_south.png',
  jeonbuk: 'jeonbuk.png',
  jeonnam: 'jeonnam.png',
  gyeongbuk: 'gyeongsang_north.png',
  gyeongnam: 'gyeongsang_south.png',
  jeju: 'jeju.png',
}

export const getCityImageUrl = (cityId) => {
  const fileName = CITY_IMAGE_BY_ID[cityId]
  return fileName ? `/cities/${fileName}` : ''
}
