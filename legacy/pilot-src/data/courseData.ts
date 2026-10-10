import type { Lesson, TextSegment } from '../types/lesson'

const t = (value: string): TextSegment => ({ kind: 'text', value })
const m = (value: string): TextSegment => ({ kind: 'math', value })
const parts = (...segments: TextSegment[]) => segments

export const courseLessons: Lesson[] = [
  {
    id: 'lesson-1',
    title: '1. Наклон, касательная и клеточки',
    order: 1,
    steps: [
      {
        id: 'lesson-1-step-1',
        title: 'Производная показывает наклон',
        type: 'theory',
        theoryParts: parts(
          t('Производная '),
          m("f'(x_0)"),
          t(' — угловой коэффициент касательной к графику в точке '),
          m('x_0'),
          t('. На подъёме он положителен, на спуске отрицателен, у горизонтальной касательной равен нулю. Если нужна сама касательная, используй '),
          m("y=f(x_0)+f'(x_0)(x-x_0)"),
          t('.'),
        ),
        hintParts: parts(t('Сначала смотри на направление касательной слева направо, а уже затем считай число.')),
      },
      {
        id: 'lesson-1-step-2',
        title: 'Проведи пальцем по графику',
        type: 'interactive',
        theoryParts: parts(
          t('Перемещай точку по графику '),
          m('f(x)=-0.15x^3+0.9x'),
          t('. Точка, касательная и значение '),
          m("f'(x)"),
          t(' относятся к одному и тому же '),
          m('x'),
          t('. Найди подъём, горизонтальную касательную и спуск.'),
        ),
        hintParts: parts(t('Нулевой наклон возникает около вершин графика, но знак меняется только после прохождения вершины.')),
      },
      {
        id: 'lesson-1-step-3',
        title: 'Знак производной в отмеченных точках',
        type: 'single_choice',
        theoryParts: parts(
          t('На графике '),
          m('f(x)=0.1x^3-0.6x'),
          t(' отмечены четыре точки. Определяй знак не по высоте точки, а по тому, растёт или убывает график рядом с ней.'),
        ),
        quiz: {
          questionParts: parts(t('В скольких отмеченных точках '), m("f'(x)<0"), t('?')),
          options: [
            { id: 'a', textParts: parts(t('0')), isCorrect: false, feedbackParts: parts(t('Есть отмеченные точки на убывающем участке.')) },
            { id: 'b', textParts: parts(t('1')), isCorrect: false, feedbackParts: parts(t('Ты пропустил ещё одну точку на спуске.')) },
            { id: 'c', textParts: parts(t('2')), isCorrect: true, feedbackParts: parts(t('Верно: в двух точках касательная наклонена вниз, поэтому производная отрицательна.')) },
            { id: 'd', textParts: parts(t('3')), isCorrect: false, feedbackParts: parts(t('Одна из выбранных точек уже лежит на подъёме.')) },
          ],
        },
      },
      {
        id: 'lesson-1-step-4',
        title: 'Клеточки: учитывай масштаб осей',
        type: 'theory',
        theoryParts: parts(
          t('Найди на касательной две удобные точки сетки и считай '),
          m('k=\\frac{\\Delta y}{\\Delta x}'),
          t('. Если одна клетка по '),
          m('x'),
          t(' равна 2, а по '),
          m('y'),
          t(' равна 1, то шаг «3 клетки вправо и 2 вверх» даёт '),
          m('k=\\frac{2\\cdot1}{3\\cdot2}=\\frac13'),
          t(', а не '),
          m('\\frac23'),
          t('.'),
        ),
        hintParts: parts(t('Вычитай координаты, а не просто считай нарисованные клетки.')),
      },
      {
        id: 'lesson-1-step-5',
        title: 'Наклон по двум точкам касательной',
        type: 'single_choice',
        theoryParts: parts(t('Касательная проходит через точки '), m('(-2;1)'), t(' и '), m('(4;4)'), t('.')),
        quiz: {
          questionParts: parts(t('Чему равна производная в точке касания?')),
          options: [
            { id: 'a', textParts: parts(m('2')), isCorrect: false, feedbackParts: parts(t('Это не отношение приращений координат.')) },
            { id: 'b', textParts: parts(m('-\\frac12')), isCorrect: false, feedbackParts: parts(t('Касательная поднимается слева направо, поэтому знак должен быть положительным.')) },
            { id: 'c', textParts: parts(m('\\frac12')), isCorrect: true, feedbackParts: parts(t('Верно: '), m('k=\\frac{4-1}{4-(-2)}=\\frac36=\\frac12'), t('.')) },
            { id: 'd', textParts: parts(m('3')), isCorrect: false, feedbackParts: parts(t('Числитель равен 3, но его нужно разделить на изменение '), m('x'), t('.')) },
          ],
        },
      },
      {
        id: 'lesson-1-step-6',
        title: 'Какая касательная круче?',
        type: 'single_choice',
        theoryParts: parts(t('У первой касательной '), m('k_1=-\\frac32'), t(', у второй '), m('k_2=\\frac12'), t('. Крутизну сравнивают по модулю наклона, а знак показывает направление.')),
        quiz: {
          questionParts: parts(t('Какая касательная круче?')),
          options: [
            { id: 'a', textParts: parts(t('Вторая, потому что её наклон положительный')), isCorrect: false, feedbackParts: parts(t('Знак задаёт направление, а не крутизну.')) },
            { id: 'b', textParts: parts(t('Первая, потому что '), m('|k_1|>|k_2|')), isCorrect: true, feedbackParts: parts(t('Верно: '), m('\\frac32>\\frac12'), t(', поэтому первая прямая круче.')) },
            { id: 'c', textParts: parts(t('Одинаково крутые')), isCorrect: false, feedbackParts: parts(t('Модули наклонов не равны.')) },
            { id: 'd', textParts: parts(t('Сравнить невозможно')), isCorrect: false, feedbackParts: parts(t('Достаточно сравнить модули угловых коэффициентов.')) },
          ],
        },
      },
      {
        id: 'lesson-1-step-7',
        title: 'Касательные, параллельные прямой',
        type: 'single_choice',
        theoryParts: parts(
          t('Для '),
          m('f(x)=x^3-3x'),
          t(' нужно найти касательные, параллельные '),
          m('y=9x-4'),
          t('. Параллельность означает одинаковый наклон: '),
          m("f'(x)=9"),
          t('.'),
        ),
        quiz: {
          questionParts: parts(t('Сколько точек касания подходит?')),
          options: [
            { id: 'a', textParts: parts(t('1')), isCorrect: false, feedbackParts: parts(t('Уравнение для точки касания имеет два корня.')) },
            { id: 'b', textParts: parts(t('2')), isCorrect: true, feedbackParts: parts(t('Верно: '), m('3x^2-3=9'), t(', значит '), m('x=\\pm2'), t('.')) },
            { id: 'c', textParts: parts(t('3')), isCorrect: false, feedbackParts: parts(t('Нужно считать решения '), m("f'(x)=9"), t(', а не степень функции.')) },
            { id: 'd', textParts: parts(t('4')), isCorrect: false, feedbackParts: parts(t('Каждому из двух корней соответствует одна точка касания.')) },
          ],
        },
      },
      {
        id: 'lesson-1-step-8',
        title: 'Алгоритм: наклон и касательная',
        type: 'boss_fight',
        theoryParts: parts(
          t('Теперь ты можешь проговорить алгоритм: 1) найди, что требуется — знак, значение или число касательных; 2) для значения возьми две точки касательной и вычисли '),
          m('\\Delta y/\\Delta x'),
          t(' с учётом масштаба; 3) для параллельности реши '),
          m("f'(x)=k"),
          t('; 4) если требуется уравнение, подставь найденный наклон в '),
          m("y=f(x_0)+f'(x_0)(x-x_0)"),
          t('; 5) проверь знак и число найденных точек.'),
        ),
      },
    ],
  },
  {
    id: 'lesson-2',
    title: '2. Скорость, остановка и разворот',
    order: 2,
    steps: [
      {
        id: 'lesson-2-step-1',
        title: 'Координата — не пройденный путь',
        type: 'theory',
        theoryParts: parts(
          m('x(t)'),
          t(' — координата тела, '),
          m("v(t)=x'(t)"),
          t(' — проекция скорости, '),
          m("a(t)=v'(t)"),
          t(' — ускорение. Отрицательная скорость означает движение в сторону убывания координаты. Пройденный путь на отрезке считают по '),
          m('S=\\int_a^b|v(t)|\\,dt'),
          t(', поэтому он не обязан равняться '),
          m('x(b)-x(a)'),
          t('.'),
        ),
      },
      {
        id: 'lesson-2-step-2',
        title: 'Сначала найди формулу скорости',
        type: 'single_choice',
        theoryParts: parts(t('Координата задана формулой '), m('x(t)=2t^3-3t^2+5'), t('.')),
        quiz: {
          questionParts: parts(t('Какая формула задаёт скорость?')),
          options: [
            { id: 'a', textParts: parts(m('6t^2-3t')), isCorrect: false, feedbackParts: parts(t('Производная '), m('-3t^2'), t(' равна '), m('-6t'), t('.')) },
            { id: 'b', textParts: parts(m('6t^2-6t')), isCorrect: true, feedbackParts: parts(t('Верно: дифференцируем каждое слагаемое, константа исчезает.')) },
            { id: 'c', textParts: parts(m('2t^2-3t')), isCorrect: false, feedbackParts: parts(t('При дифференцировании степени множатся на коэффициенты.')) },
            { id: 'd', textParts: parts(m('6t-6')), isCorrect: false, feedbackParts: parts(t('Это уже похоже на производную скорости, то есть ускорение.')) },
          ],
        },
      },
      {
        id: 'lesson-2-step-3',
        title: 'Скорость в заданный момент',
        type: 'single_choice',
        theoryParts: parts(t('Тело движется по закону '), m('x(t)=3t^2-18t+4'), t('. Найдите скорость при '), m('t=5'), t('.')),
        quiz: {
          questionParts: parts(t('Чему равно '), m('v(5)'), t('?')),
          options: [
            { id: 'a', textParts: parts(t('12')), isCorrect: true, feedbackParts: parts(t('Верно: '), m('v(t)=6t-18'), t(', поэтому '), m('v(5)=12'), t('.')) },
            { id: 'b', textParts: parts(t('16')), isCorrect: false, feedbackParts: parts(t('Константа 4 исчезает при дифференцировании.')) },
            { id: 'c', textParts: parts(t('30')), isCorrect: false, feedbackParts: parts(t('Нужно вычесть 18 после подстановки.')) },
            { id: 'd', textParts: parts(t('49')), isCorrect: false, feedbackParts: parts(t('Это значение координаты, а нужна её производная.')) },
          ],
        },
      },
      {
        id: 'lesson-2-step-4',
        title: 'Остановка не всегда означает разворот',
        type: 'theory',
        theoryParts: parts(
          t('У '),
          m('x(t)=t^2'),
          t(' в момент '),
          m('t=0'),
          t(' скорость меняет знак: тело разворачивается. У '),
          m('x(t)=t^3'),
          t(' тоже '),
          m('v(0)=0'),
          t(', но '),
          m('v(t)=3t^2\\ge0'),
          t(' по обе стороны: это мгновенная остановка без разворота. Всегда проверяй знак скорости до и после нуля.'),
        ),
      },
      {
        id: 'lesson-2-step-5',
        title: 'Четыре остановки на графике синуса',
        type: 'single_choice',
        theoryParts: parts(
          t('Координата равна '),
          m('x(t)=1.5\\sin t+0.3t'),
          t(' на '),
          m('[0;12]'),
          t('. Остановки решают уравнением '),
          m('v(t)=1.5\\cos t+0.3=0'),
          t('.'),
        ),
        quiz: {
          questionParts: parts(t('Сколько моментов остановки лежит на отрезке?')),
          options: [
            { id: 'a', textParts: parts(t('2')), isCorrect: false, feedbackParts: parts(t('На отрезке почти два полных периода, корней больше двух.')) },
            { id: 'b', textParts: parts(t('3')), isCorrect: false, feedbackParts: parts(t('Ты пропустил один корень во втором периоде.')) },
            { id: 'c', textParts: parts(t('4')), isCorrect: true, feedbackParts: parts(t('Верно: приблизительно '), m('t=1.772;\\ 4.511;\\ 8.055;\\ 10.794'), t('.')) },
            { id: 'd', textParts: parts(t('5')), isCorrect: false, feedbackParts: parts(t('Концы отрезка не являются корнями скорости.')) },
          ],
        },
      },
      {
        id: 'lesson-2-step-6',
        title: 'Не перепутай скорость и ускорение',
        type: 'single_choice',
        theoryParts: parts(t('Пусть '), m('x(t)=2t^3-9t^2+12t'), t('.')),
        quiz: {
          questionParts: parts(t('Чему равно ускорение при '), m('t=2'), t('?')),
          options: [
            { id: 'a', textParts: parts(t('0')), isCorrect: false, feedbackParts: parts(t('В этот момент скорость может иметь особое значение, но ускорение не равно нулю.')) },
            { id: 'b', textParts: parts(t('2')), isCorrect: false, feedbackParts: parts(t('Нужно дважды продифференцировать координату.')) },
            { id: 'c', textParts: parts(t('4')), isCorrect: false, feedbackParts: parts(t('После второй производной получается линейная функция.')) },
            { id: 'd', textParts: parts(t('6')), isCorrect: true, feedbackParts: parts(t('Верно: '), m('v=6t^2-18t+12'), t(', '), m('a=12t-18'), t(', '), m('a(2)=6'), t('.')) },
          ],
        },
      },
      {
        id: 'lesson-2-step-7',
        title: 'Алгоритм задач о движении',
        type: 'boss_fight',
        theoryParts: parts(
          t('Проговори решение: 1) выясни, дана координата, скорость или ускорение; 2) дифференцируй до нужной величины; 3) подставь момент времени или реши '),
          m('v(t)=0'),
          t('; 4) для разворота проверь смену знака '),
          m('v'),
          t('; 5) не называй изменение координаты пройденным путём, если направление менялось.'),
        ),
      },
    ],
  },
  {
    id: 'lesson-3',
    title: "3. Как связаны f(x) и f'(x)",
    order: 3,
    steps: [
      {
        id: 'lesson-3-step-1',
        title: 'Два графика — одна история',
        type: 'theory',
        theoryParts: parts(t('На верхнем графике показана '), m('f(x)'), t(', на нижнем — '), m("f'(x)"), t('. Пока '), m('f'), t(' растёт, график '), m("f'"), t(' находится выше оси; пока убывает — ниже.')),
      },
      {
        id: 'lesson-3-step-2',
        title: 'Нули производной: нужна смена знака',
        type: 'theory',
        theoryParts: parts(t('Корень '), m("f'(x)"), t(' даёт горизонтальную касательную к '), m('f'), t(', но не гарантирует экстремум. Переход '), m('-\\to+'), t(' даёт минимум, '), m('+\\to-'), t(' — максимум, а касание оси без смены знака экстремума не создаёт.')),
      },
      {
        id: 'lesson-3-step-3',
        title: 'Распознай график производной',
        type: 'single_choice',
        theoryParts: parts(t('Дана функция '), m('f(x)=x^3-3x'), t('.')),
        quiz: {
          questionParts: parts(t('Какой формулой задаётся её производная?')),
          options: [
            { id: 'a', textParts: parts(m('x^2-3')), isCorrect: false, feedbackParts: parts(t('У производной '), m('x^3'), t(' появляется множитель 3.')) },
            { id: 'b', textParts: parts(m('3x^2')), isCorrect: false, feedbackParts: parts(t('Производная слагаемого '), m('-3x'), t(' равна '), m('-3'), t('.')) },
            { id: 'c', textParts: parts(m('3x^2-3')), isCorrect: true, feedbackParts: parts(t('Верно: кубическая функция превращается в параболу.')) },
            { id: 'd', textParts: parts(m('3x-3')), isCorrect: false, feedbackParts: parts(t('Степень '), m('x^3'), t(' после дифференцирования уменьшается до 2, а не до 1.')) },
          ],
        },
      },
      {
        id: 'lesson-3-step-4',
        title: 'Минимум по графику производной',
        type: 'single_choice',
        theoryParts: parts(t('Производная обращается в ноль при '), m('x=-2'), t(' и '), m('x=1'), t('. Её знаки по промежуткам: '), m('+,-,+'), t('.')),
        quiz: {
          questionParts: parts(t('В какой точке функция имеет минимум?')),
          options: [
            { id: 'a', textParts: parts(m('x=-2')), isCorrect: false, feedbackParts: parts(t('Там знак меняется с плюса на минус — это максимум.')) },
            { id: 'b', textParts: parts(m('x=1')), isCorrect: true, feedbackParts: parts(t('Верно: переход '), m('-\\to+'), t(' означает минимум.')) },
            { id: 'c', textParts: parts(t('В обеих точках')), isCorrect: false, feedbackParts: parts(t('Типы смены знака у корней разные.')) },
            { id: 'd', textParts: parts(t('Минимума нет')), isCorrect: false, feedbackParts: parts(t('Переход с минуса на плюс есть при '), m('x=1'), t('.')) },
          ],
        },
      },
      {
        id: 'lesson-3-step-5',
        title: 'Наибольшее значение на отрезке',
        type: 'single_choice',
        theoryParts: parts(t('На всём отрезке '), m('[-3;2]'), t(' выполнено '), m("f'(x)<0"), t('. Значит, функция строго убывает.')),
        quiz: {
          questionParts: parts(t('Где функция принимает наибольшее значение?')),
          options: [
            { id: 'a', textParts: parts(m('x=2')), isCorrect: false, feedbackParts: parts(t('Это правый конец, где у убывающей функции значение наименьшее.')) },
            { id: 'b', textParts: parts(m('x=-3')), isCorrect: true, feedbackParts: parts(t('Верно: максимум убывающей функции на отрезке находится на левом конце.')) },
            { id: 'c', textParts: parts(m('x=0')), isCorrect: false, feedbackParts: parts(t('Внутренняя точка не обгоняет левый конец при строгом убывании.')) },
            { id: 'd', textParts: parts(t('Определить нельзя')), isCorrect: false, feedbackParts: parts(t('Знака производной достаточно, чтобы сравнить значения на всём отрезке.')) },
          ],
        },
      },
      {
        id: 'lesson-3-step-6',
        title: 'Целые точки на промежутке убывания',
        type: 'single_choice',
        theoryParts: parts(t('Дана производная '), m("f'(x)=(x-1)(x-5)"), t('. Она отрицательна при '), m('1<x<5'), t('.')),
        quiz: {
          questionParts: parts(t('Найдите сумму целых '), m('x'), t(', для которых '), m("f'(x)<0"), t('.')),
          options: [
            { id: 'a', textParts: parts(t('5')), isCorrect: false, feedbackParts: parts(t('Ты учёл не все целые точки внутри интервала.')) },
            { id: 'b', textParts: parts(t('7')), isCorrect: false, feedbackParts: parts(t('Целые точки здесь '), m('2,3,4'), t('.')) },
            { id: 'c', textParts: parts(t('9')), isCorrect: true, feedbackParts: parts(t('Верно: '), m('2+3+4=9'), t('. Нули 1 и 5 не входят, потому что требуется строгий знак.')) },
            { id: 'd', textParts: parts(t('15')), isCorrect: false, feedbackParts: parts(t('Ты включил границы, где производная равна нулю, и получил неверную сумму.')) },
          ],
        },
      },
      {
        id: 'lesson-3-step-7',
        title: 'Параллельная касательная: ищи уровень k',
        type: 'single_choice',
        theoryParts: parts(t('На рисунке дан график '), m("f'(x)=0.3x^2-3.2"), t('. Нужно найти касательные к '), m('f'), t(', параллельные прямой '), m('y=-2x+7'), t('.')),
        quiz: {
          questionParts: parts(t('Сколько подходящих точек касания?')),
          options: [
            { id: 'a', textParts: parts(t('0')), isCorrect: false, feedbackParts: parts(t('Горизонталь '), m('y=-2'), t(' пересекает параболу.')) },
            { id: 'b', textParts: parts(t('1')), isCorrect: false, feedbackParts: parts(t('Уровень выше вершины параболы даёт два симметричных пересечения.')) },
            { id: 'c', textParts: parts(t('3')), isCorrect: false, feedbackParts: parts(t('Квадратное уравнение не может иметь три различных корня.')) },
            { id: 'd', textParts: parts(t('2')), isCorrect: true, feedbackParts: parts(t('Верно: '), m('0.3x^2-3.2=-2'), t(', откуда '), m('x=\\pm2'), t('.')) },
          ],
        },
      },
      {
        id: 'lesson-3-step-8',
        title: 'Алгоритм чтения графика производной',
        type: 'boss_fight',
        theoryParts: parts(t('Ты можешь объяснить алгоритм: 1) отметь нули '), m("f'"), t('; 2) выпиши знаки на промежутках; 3) переход '), m('-\\to+'), t(' считай минимумом, '), m('+\\to-'), t(' — максимумом, а ноль без смены знака не считай экстремумом; 4) для наибольшего значения проверь ещё концы отрезка; 5) для параллельной прямой решай '), m("f'(x)=k"), t('.')),
      },
    ],
  },
  {
    id: 'lesson-4',
    title: '4. Первообразная и ориентированная площадь',
    order: 4,
    steps: [
      {
        id: 'lesson-4-step-1',
        title: 'Формула Ньютона — Лейбница',
        type: 'theory',
        theoryParts: parts(t('Если '), m("F'(x)=f(x)"), t(', то '), m('\\int_a^b f(x)\\,dx=F(b)-F(a)'), t('. Это ориентированная площадь: части выше оси дают плюс, ниже оси — минус. Геометрическая площадь, в отличие от интеграла, всегда неотрицательна.')),
      },
      {
        id: 'lesson-4-step-2',
        title: 'Трапеция над осью',
        type: 'single_choice',
        theoryParts: parts(t('На отрезке '), m('[1;5]'), t(' график — отрезок от точки '), m('(1;2)'), t(' до '), m('(5;4)'), t(' и весь лежит выше оси '), m('Ox'), t('.')),
        quiz: {
          questionParts: parts(t('Чему равен '), m('\\int_1^5 f(x)\\,dx'), t('?')),
          options: [
            { id: 'a', textParts: parts(t('8')), isCorrect: false, feedbackParts: parts(t('Это площадь прямоугольника только с меньшей высотой.')) },
            { id: 'b', textParts: parts(t('10')), isCorrect: false, feedbackParts: parts(t('Нужно усреднить обе высоты 2 и 4.')) },
            { id: 'c', textParts: parts(t('12')), isCorrect: true, feedbackParts: parts(t('Верно: '), m('\\frac{2+4}{2}\\cdot(5-1)=12'), t('.')) },
            { id: 'd', textParts: parts(t('16')), isCorrect: false, feedbackParts: parts(t('Это ширина, умноженная только на большую высоту.')) },
          ],
        },
      },
      {
        id: 'lesson-4-step-3',
        title: 'Площадь ниже оси вычитается',
        type: 'single_choice',
        theoryParts: parts(t('На отрезке '), m('[a;b]'), t(' площадь части над осью равна 5, а геометрическая площадь части под осью равна 7.')),
        quiz: {
          questionParts: parts(t('Чему равен интеграл '), m('\\int_a^b f(x)\\,dx'), t('?')),
          options: [
            { id: 'a', textParts: parts(t('-12')), isCorrect: false, feedbackParts: parts(t('Площадь над осью должна прибавляться.')) },
            { id: 'b', textParts: parts(t('-2')), isCorrect: true, feedbackParts: parts(t('Верно: ориентированная площадь равна '), m('5-7=-2'), t('.')) },
            { id: 'c', textParts: parts(t('2')), isCorrect: false, feedbackParts: parts(t('Знак отрицательный, потому что нижняя часть больше верхней.')) },
            { id: 'd', textParts: parts(t('12')), isCorrect: false, feedbackParts: parts(t('Это сумма геометрических площадей, а не определённый интеграл.')) },
          ],
        },
      },
      {
        id: 'lesson-4-step-4',
        title: 'Восстанови значение первообразной',
        type: 'single_choice',
        theoryParts: parts(t('Известно, что '), m('F(2)=-3'), t(' и '), m('\\int_2^8 f(x)\\,dx=15'), t(', причём '), m("F'=f"), t('.')),
        quiz: {
          questionParts: parts(t('Чему равно '), m('F(8)'), t('?')),
          options: [
            { id: 'a', textParts: parts(t('-18')), isCorrect: false, feedbackParts: parts(t('Интеграл равен '), m('F(8)-F(2)'), t(', а не обратной разности.')) },
            { id: 'b', textParts: parts(t('-12')), isCorrect: false, feedbackParts: parts(t('К начальному значению нужно прибавить изменение 15.')) },
            { id: 'c', textParts: parts(t('12')), isCorrect: true, feedbackParts: parts(t('Верно: '), m('F(8)=F(2)+15=-3+15=12'), t('.')) },
            { id: 'd', textParts: parts(t('18')), isCorrect: false, feedbackParts: parts(t('Ты потерял отрицательное начальное значение '), m('F(2)'), t('.')) },
          ],
        },
      },
      {
        id: 'lesson-4-step-5',
        title: 'Нули функции по графику первообразной',
        type: 'single_choice',
        theoryParts: parts(t('Дан график первообразной '), m('F'), t('. Нули функции '), m("f=F'"), t(' — все точки, где касательная к '), m('F'), t(' горизонтальна. Это могут быть не только экстремумы, но и стационарный перегиб.')),
        quiz: {
          questionParts: parts(t('На рисунке горизонтальная касательная есть в максимуме при '), m('x=-1'), t(' и в стационарном перегибе при '), m('x=2'), t('. Сколько нулей у '), m('f'), t('?')),
          options: [
            { id: 'a', textParts: parts(t('0')), isCorrect: false, feedbackParts: parts(t('На графике есть горизонтальные касательные.')) },
            { id: 'b', textParts: parts(t('1')), isCorrect: false, feedbackParts: parts(t('Ты учёл экстремум, но пропустил стационарный перегиб.')) },
            { id: 'c', textParts: parts(t('2')), isCorrect: true, feedbackParts: parts(t('Верно: в обеих точках '), m("F'(x)=f(x)=0"), t('.')) },
            { id: 'd', textParts: parts(t('3')), isCorrect: false, feedbackParts: parts(t('Других горизонтальных касательных на рисунке нет.')) },
          ],
        },
      },
      {
        id: 'lesson-4-step-6',
        title: 'Проведи пальцем по границе площади',
        type: 'interactive',
        theoryParts: parts(t('Двигай правую границу '), m('b'), t(' и следи за '), m('\\int_a^b f(x)\\,dx'), t('. Когда новая полоска графика выше оси, накопленный интеграл растёт; когда ниже — уменьшается.')),
        hintParts: parts(t('Текущее значение должно меняться вместе с закрашенной областью и границей.')),
      },
      {
        id: 'lesson-4-step-7',
        title: 'Собери ориентированную площадь',
        type: 'single_choice',
        theoryParts: parts(t('Разбей фигуру в нулях графика. Найди обычную площадь каждой части, затем поставь плюс частям над '), m('Ox'), t(' и минус частям под '), m('Ox'), t('. Только после этого складывай.')),
        quiz: {
          questionParts: parts(t('Какой алгоритм верный?')),
          options: [
            { id: 'a', textParts: parts(t('Сложить все площади без знаков и вычесть '), m('F(a)')), isCorrect: false, feedbackParts: parts(t('Определённый интеграл учитывает знак каждой части.')) },
            { id: 'b', textParts: parts(t('Разбить в нулях → найти площади → дать им знаки → сложить')), isCorrect: true, feedbackParts: parts(t('Верно. А если известна первообразная, тот же результат равен '), m('F(b)-F(a)'), t('.')) },
            { id: 'c', textParts: parts(t('Сложить только части выше оси')), isCorrect: false, feedbackParts: parts(t('Части ниже оси тоже входят — со знаком минус.')) },
            { id: 'd', textParts: parts(t('Вычесть меньшую площадь из большей и всегда взять модуль')), isCorrect: false, feedbackParts: parts(t('Модуль уничтожит знак интеграла.')) },
          ],
        },
      },
      {
        id: 'lesson-4-step-8',
        title: 'Алгоритм: интеграл по графику',
        type: 'boss_fight',
        theoryParts: parts(
          t('Теперь ты можешь проговорить алгоритм: 1) определи, нужна геометрическая площадь или ориентированный интеграл; 2) разбей область в нулях графика; 3) посчитай площади фигур; 4) частям над '),
          m('Ox'),
          t(' поставь «+», частям под осью — «−»; 5) сложи их, а при известной первообразной используй '),
          m('F(b)=F(a)+\\int_a^b f(x)\\,dx'),
          t('.'),
        ),
      },
    ],
  },
  {
    id: 'lesson-5',
    title: '5. Босс-файт: перенос на новые задачи',
    order: 5,
    steps: [
      {
        id: 'lesson-5-step-1',
        title: '1 из 8. Уравнение новой касательной',
        type: 'single_choice',
        theoryParts: parts(t('Касательная к графику проходит через узлы '), m('(-3;4)'), t(' и '), m('(1;-2)'), t('.')),
        quiz: {
          questionParts: parts(t('Какое уравнение задаёт эту касательную?')),
          options: [
            { id: 'a', textParts: parts(m('y=-\\frac23x+2')), isCorrect: false, feedbackParts: parts(t('Ты перевернул отношение приращений: наклон должен быть '), m('-\\frac32'), t('.')) },
            { id: 'b', textParts: parts(m('y=-\\frac32x-\\frac12')), isCorrect: true, feedbackParts: parts(t('Верно: '), m('k=\\frac{-2-4}{1-(-3)}=-\\frac32'), t(', а подстановка точки '), m('(1;-2)'), t(' даёт свободный член '), m('-\\frac12'), t('. Поэтому и '), m("f'(x_0)=-\\frac32"), t('.')) },
            { id: 'c', textParts: parts(m('y=\\frac32x-\\frac12')), isCorrect: false, feedbackParts: parts(t('Касательная идёт вниз слева направо, поэтому наклон отрицательный.')) },
            { id: 'd', textParts: parts(m('y=-\\frac32x+4')), isCorrect: false, feedbackParts: parts(t('Наклон верный, но прямая с таким свободным членом не проходит через данные точки.')) },
          ],
        },
      },
      {
        id: 'lesson-5-step-2',
        title: '2 из 8. Знак в отмеченных точках',
        type: 'single_choice',
        theoryParts: parts(t('На графике '), m('f(x)=x^3-3x'), t(' отмечены точки с абсциссами '), m('-2,-1,0,2'), t('.')),
        quiz: {
          questionParts: parts(t('В скольких из них '), m("f'(x)<0"), t('?')),
          options: [
            { id: 'a', textParts: parts(t('0')), isCorrect: false, feedbackParts: parts(t('При '), m('x=0'), t(' график убывает.')) },
            { id: 'b', textParts: parts(t('2')), isCorrect: false, feedbackParts: parts(t('В точках '), m('x=\\pm1'), t(' производная равна нулю, а не отрицательна.')) },
            { id: 'c', textParts: parts(t('3')), isCorrect: false, feedbackParts: parts(t('Крайние отмеченные точки лежат на подъёме.')) },
            { id: 'd', textParts: parts(t('1')), isCorrect: true, feedbackParts: parts(t('Верно: '), m("f'(x)=3x^2-3"), t(' отрицательна только при '), m('x=0'), t(' среди отмеченных точек.')) },
          ],
        },
      },
      {
        id: 'lesson-5-step-3',
        title: '3 из 8. Минимумы по производной',
        type: 'single_choice',
        theoryParts: parts(t('График '), m("f'"), t(' пересекает ось при '), m('x=-2,1,4'), t('; знаки слева направо: '), m('-,+,-,+'), t('.')),
        quiz: {
          questionParts: parts(t('Сколько точек минимума у '), m('f'), t('?')),
          options: [
            { id: 'a', textParts: parts(t('2')), isCorrect: true, feedbackParts: parts(t('Верно: переход '), m('-\\to+'), t(' есть при '), m('x=-2'), t(' и '), m('x=4'), t('.')) },
            { id: 'b', textParts: parts(t('1')), isCorrect: false, feedbackParts: parts(t('Ты нашёл только один из двух переходов с минуса на плюс.')) },
            { id: 'c', textParts: parts(t('3')), isCorrect: false, feedbackParts: parts(t('Не каждый ноль производной является минимумом.')) },
            { id: 'd', textParts: parts(t('0')), isCorrect: false, feedbackParts: parts(t('В таблице знаков есть переходы с минуса на плюс.')) },
          ],
        },
      },
      {
        id: 'lesson-5-step-4',
        title: '4 из 8. Максимум на отрезке',
        type: 'single_choice',
        theoryParts: parts(t('На всём отрезке '), m('[-5;1]'), t(' выполнено '), m("f'(x)<0"), t('.')),
        quiz: {
          questionParts: parts(t('В какой точке достигается наибольшее значение '), m('f'), t('?')),
          options: [
            { id: 'a', textParts: parts(m('x=1')), isCorrect: false, feedbackParts: parts(t('Это правый конец убывающей функции.')) },
            { id: 'b', textParts: parts(m('x=0')), isCorrect: false, feedbackParts: parts(t('Внутренняя точка не даёт максимум при строгом убывании.')) },
            { id: 'c', textParts: parts(m('x=-5')), isCorrect: true, feedbackParts: parts(t('Верно: убывающая функция максимальна на левом конце.')) },
            { id: 'd', textParts: parts(t('Ни в одной')), isCorrect: false, feedbackParts: parts(t('Непрерывная функция на замкнутом отрезке достигает максимума.')) },
          ],
        },
      },
      {
        id: 'lesson-5-step-5',
        title: '5 из 8. Целые точки убывания',
        type: 'single_choice',
        theoryParts: parts(t('Известно, что '), m("f'(x)=(x-2)(x-6)"), t('.')),
        quiz: {
          questionParts: parts(t('Найдите сумму целых '), m('x'), t(', где '), m("f'(x)<0"), t('.')),
          options: [
            { id: 'a', textParts: parts(t('12')), isCorrect: true, feedbackParts: parts(t('Верно: подходят '), m('3,4,5'), t(', их сумма равна 12.')) },
            { id: 'b', textParts: parts(t('8')), isCorrect: false, feedbackParts: parts(t('Ты пропустил одну целую точку внутри '), m('(2;6)'), t('.')) },
            { id: 'c', textParts: parts(t('14')), isCorrect: false, feedbackParts: parts(t('Границы 2 и 6 не входят: там производная равна нулю.')) },
            { id: 'd', textParts: parts(t('20')), isCorrect: false, feedbackParts: parts(t('Нужно брать только точки между корнями.')) },
          ],
        },
      },
      {
        id: 'lesson-5-step-6',
        title: '6 из 8. Параллельные касательные',
        type: 'single_choice',
        theoryParts: parts(t('Дан график производной '), m("f'(x)=0.5x^2-1"), t('. Ищут касательные к '), m('f'), t(', параллельные '), m('y=7x+3'), t('.')),
        quiz: {
          questionParts: parts(t('Сколько точек касания подходит?')),
          options: [
            { id: 'a', textParts: parts(t('0')), isCorrect: false, feedbackParts: parts(t('Уровень '), m('y=7'), t(' пересекает параболу.')) },
            { id: 'b', textParts: parts(t('1')), isCorrect: false, feedbackParts: parts(t('Пересечения симметричны относительно оси '), m('Oy'), t('.')) },
            { id: 'c', textParts: parts(t('2')), isCorrect: true, feedbackParts: parts(t('Верно: '), m('0.5x^2-1=7'), t(', откуда '), m('x=\\pm4'), t('.')) },
            { id: 'd', textParts: parts(t('4')), isCorrect: false, feedbackParts: parts(t('Корней у квадратного уравнения не больше двух.')) },
          ],
        },
      },
      {
        id: 'lesson-5-step-7',
        title: '7 из 8. Скорость в новый момент',
        type: 'single_choice',
        theoryParts: parts(t('Координата тела: '), m('x(t)=t^3-6t^2+9t+2'), t('.')),
        quiz: {
          questionParts: parts(t('Чему равна скорость при '), m('t=4'), t('?')),
          options: [
            { id: 'a', textParts: parts(t('1')), isCorrect: false, feedbackParts: parts(t('Проверь производную каждого слагаемого.')) },
            { id: 'b', textParts: parts(t('9')), isCorrect: true, feedbackParts: parts(t('Верно: '), m('v(t)=3t^2-12t+9'), t(' и '), m('v(4)=9'), t('.')) },
            { id: 'c', textParts: parts(t('18')), isCorrect: false, feedbackParts: parts(t('Линейное слагаемое после дифференцирования даёт 9, а не 18.')) },
            { id: 'd', textParts: parts(t('22')), isCorrect: false, feedbackParts: parts(t('Это не значение производной при '), m('t=4'), t('.')) },
          ],
        },
      },
      {
        id: 'lesson-5-step-8',
        title: '8 из 8. Ориентированная площадь',
        type: 'single_choice',
        theoryParts: parts(t('Между '), m('a'), t(' и '), m('b'), t(' график образует площадь 6 над осью и площадь 9 под осью.')),
        quiz: {
          questionParts: parts(t('Чему равен '), m('\\int_a^b f(x)\\,dx'), t('?')),
          options: [
            { id: 'a', textParts: parts(t('15')), isCorrect: false, feedbackParts: parts(t('Это геометрическая сумма, а нужен интеграл со знаками.')) },
            { id: 'b', textParts: parts(t('3')), isCorrect: false, feedbackParts: parts(t('Большая часть находится ниже оси, поэтому итог отрицательный.')) },
            { id: 'c', textParts: parts(t('-15')), isCorrect: false, feedbackParts: parts(t('Часть над осью должна войти со знаком плюс.')) },
            { id: 'd', textParts: parts(t('-3')), isCorrect: true, feedbackParts: parts(t('Верно: '), m('6-9=-3'), t('.')) },
          ],
        },
      },
      {
        id: 'lesson-5-step-9',
        title: 'Экзаменационный алгоритм готов',
        type: 'boss_fight',
        theoryParts: parts(t('Теперь ты можешь объяснить общий маршрут: определить, какой график дан; перевести условие на язык производной, скорости или интеграла; выполнить одно точное действие — найти знак, решить '), m("f'(x)=k"), t(', продифференцировать или сложить площади со знаками; затем проверить границы отрезка, масштаб осей и смысл ответа. Новые числа не меняют алгоритм.')),
      },
    ],
  },
]

export const courseOverview = courseLessons.map((lesson) => ({
  id: lesson.id,
  title: lesson.title,
  available: true,
}))
