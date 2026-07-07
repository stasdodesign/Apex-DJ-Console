export type Category = {
  id: string;
  nameEn: string;
  nameRu: string;
};

export const CATEGORIES: Category[] = [
  { id: 'evolution', nameEn: 'Evolution', nameRu: 'Эволюция' },
  { id: 'avatars', nameEn: 'Avatars', nameRu: 'Аватары' },
  { id: 'characters', nameEn: 'Characters', nameRu: 'Персонажи' },
  { id: 'automotive', nameEn: 'Automotive', nameRu: 'Автомобили' },
  { id: 'car_ui', nameEn: 'Car UI', nameRu: 'Авто-интерфейсы' },
  { id: 'hardware', nameEn: 'Hardware', nameRu: 'Оборудование' },
  { id: 'fantasy_ui', nameEn: 'Fantasy UI', nameRu: 'Фэнтези UI' },
  { id: 'industrial', nameEn: 'Industrial', nameRu: 'Индустриальный' },
  { id: 'isometric', nameEn: 'Isometric', nameRu: 'Изометрия' },
  { id: 'typography', nameEn: 'Typography', nameRu: 'Типографика' },
  { id: 'corporate', nameEn: 'Corporate', nameRu: 'Корпоративный' },
  { id: 'geometry', nameEn: 'Geometry', nameRu: 'Геометрия' },
  { id: 'photography', nameEn: 'Photography', nameRu: 'Фотография' },
  { id: 'process', nameEn: 'Process', nameRu: 'Процесс' },
];
