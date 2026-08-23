# Interfaces у TypeScript — канспект

Прыклады ў гэтым канспекце ўзятыя з рэальнага файла праекта:
`src/lib/cv_creator_custom/orchestratot.ts`

---

## 1. Што такое `interface`

`interface` апісвае **форму аб'екта**: якія ў яго палі і якога яны тыпу. Гэта толькі праверка на этапе кампіляцыі — у выніковым JS-кодзе інтэрфейсаў наогул няма, яны знікаюць.

```ts
interface AgentResult<T> {
  agentName: string;
  data: T;
}
```

Гэта кажа: "любы аб'ект гэтага тыпу павінен мець `agentName: string` і `data: T`".

### Structural typing (важна!)

У TypeScript тып правяраецца **па форме**, а не па назве. У адрозненне ад Java/C#, дзе трэба явна напісаць `class Foo implements Bar`, у TS дастаткова, каб форма супадала:

```ts
const result = { agentName: "extract_cv", data: someData };
// гэты аб'ект аўтаматычна падыходзіць пад AgentResult<...>,
// хоць нідзе не напісана "implements AgentResult"
```

---

## 2. Прыклад 1 — generic-інтэрфейс `AgentResult<T>`

```ts
interface AgentResult<T> {
  agentName: string;
  data: T;
}
```

`<T>` — гэта параметр тыпу (як у Java/C# generics). Ён кажа: "тып `data` мы падставім пазней, у момант выкарыстання".

У файле ён выкарыстоўваецца тут:

```ts
async function createCVFromText(
  userId: string,
  inputText: string,
): Promise<AgentResult<CV_Structure>> {
  ...
  return { agentName: "extract_cv", data: extracted };
}
```

`AgentResult<CV_Structure>` азначае: падстаў `T = CV_Structure`. Атрымліваецца тып:

```ts
{ agentName: string; data: CV_Structure }
```

І сапраўды, `return` у канцы функцыі вяртае менавіта такую форму. Калі б забыліся на поле (напрыклад, `agentName`) — TypeScript паказаў бы памылку кампіляцыі яшчэ да запуску кода.

---

## 3. Прыклад 2 — `keyof T`

```ts
interface CVCompletionState<T> {
  isComplete: boolean;
  missingFields: (keyof T)[];
}
```

`keyof T` бярэ тып `T` і вяртае **union усіх назваў яго палёў** як тыпаў-радкоў.

Напрыклад, калі `CV_Structure` мае палі `fullName`, `experience`, `education`, `skills`, то:

```ts
keyof CV_Structure // "fullName" | "experience" | "education" | "skills" | ...
```

Гэта выкарыстана тут:

```ts
const requiredFields: (keyof CV_Structure)[] = [
  "fullName",
  "experience",
  "education",
  "skills",
];
```

Калі б хтосьці напісаў `"fulName"` (з апіскай) — TypeScript адразу паказаў бы памылку, бо такога ключа няма ў `CV_Structure`. Гэта абараняе ад друкарскіх памылак у назвах палёў.

---

## 4. Прыклад 3 — абмежаванне generic (`extends`)

```ts
async function checkStateOfCV<T extends CV_Structure>(
  result: AgentResult<T>,
): Promise<AgentResult<CVCompletionState<T>>> {
  ...
}
```

`<T extends CV_Structure>` — гэта абмежаванне: "`T` можа быць любым тыпам, але толькі калі ён сумяшчальны з `CV_Structure`" (мае прынамсі ўсе яе палі).

Такім чынам, тып `T`, які прыйшоў у функцыю, "пранесены" праз усю яе — і вяртаецца ў выніку без страты канкрэтыкі (`AgentResult<CVCompletionState<T>>`), а не абагульняецца проста да `CV_Structure`.

---

## 5. `interface` vs `type`

Абодва могуць апісваць форму аб'екта, і часта ўзаемазаменныя. Асноўныя адрозненні:

| | `interface` | `type` |
|---|---|---|
| Пашырэнне | `interface B extends A {}` | `type B = A & { ... }` |
| Дапаўненне пасля аб'яўлення | можна (declaration merging) | нельга |
| Union-тыпы (`"a" \| "b"`) | не ўмее | умее |
| Аб'екты/класы | асноўны выпадак выкарыстання | таксама можна |

Практычнае правіла: калі апісваеш форму аб'екта — звычайна `interface`; калі патрэбны union, tuple ці нейкая арыфметыка тыпаў — `type`.

---

## 6. Пашырэнне інтэрфейсаў — больш магчымасцей

`extends` умее больш, чым проста "адзін інтэрфейс ад аднаго".

### 6.1 Множнае пашырэнне (`extends A, B`)

Інтэрфейс можа пашыраць **некалькі** інтэрфейсаў адразу — праз коску. Вынік мае ўсе палі ад усіх бацькоў:

```ts
interface Shape {
  color: string;
}

interface Sized {
  size: number;
}

interface Box extends Shape, Sized {
  label: string;
}

const box: Box = { color: "red", size: 10, label: "small box" };
// Box патрабуе: color, size, label — усё разам
```

Калі ў `Shape` і `Sized` было б аднолькавае поле з рознымі несумяшчальнымі тыпамі — TS выдасць памылку пры аб'яўленні `Box` (немагчыма пашырыць абодва канфліктуючыя тыпы адначасова).

### 6.2 Пашырэнне generic-інтэрфейсу

Можна пашыраць generic-інтэрфейс, падставіўшы канкрэтны тып або пранесці ўласны параметр тыпу далей:

```ts
interface Paginated<T> {
  items: T[];
  total: number;
}

// пранесены генерык — SearchResult<T> застаецца generic
interface SearchResult<T> extends Paginated<T> {
  query: string;
}

const res: SearchResult<string> = {
  items: ["react", "typescript"],
  total: 2,
  query: "type",
};
```

### 6.3 `class ... implements Interface`

Інтэрфейс можна выкарыстаць як кантракт для **класа** — тады кампілятар правярае, што клас рэалізаваў усе патрабаваныя палі і метады:

```ts
interface Greeter {
  greet(name: string): string;
}

class EnglishGreeter implements Greeter {
  greet(name: string) {
    return `Hello, ${name}!`;
  }
}
```

Калі забыцца рэалізаваць `greet` — памылка кампіляцыі яшчэ да запуску. Гэта тое самае "structural typing", але цяпер яго відавочна абяцае клас праз ключавое слова `implements`.

### 6.4 Declaration merging (паўтарэнне і пашырэнне)

Калі аб'явіць `interface` з той жа назвай **двойчы** ў адной вобласці бачнасці, TypeScript аб'яднае іх палі ў адзін тып (гэта немагчыма з `type`):

```ts
interface Config {
  debug: boolean;
}

interface Config {
  timeout: number;
}

// выніковы Config патрабуе абодва палі:
const cfg: Config = { debug: true, timeout: 3000 };
```

Гэта звычайна выкарыстоўваецца не наўмысна ў сваім кодзе, а для **дапаўнення тыпаў з бібліятэк** (напрыклад, дадаць уласнае поле да `Express.Request` ці глабальнага `Window`). У сваім жа кодзе выпадковае supplying двух аднолькавых імёнаў інтэрфейсаў можа стаць крыніцай блытаніны — таму гэта хутчэй веды "для чытання чужога кода", чым паўсядзённы прыём.

---

## 7. Выключэнне і выбарка палёў: Utility Types

Часта трэба не "пашырыць" інтэрфейс, а наадварот — узяць яго і **пабудаваць новы тып з часткі палёў** (выключыўшы або пакінуўшы толькі некаторыя). Для гэтага ў TypeScript ёсць убудаваныя ўтылітарныя тыпы (працуюць і з `interface`, і з `type`):

```ts
interface Applicant {
  fullName: string;
  email: string;
  phone?: string;
}
```

| Utility type | Што робіць | Прыклад |
|---|---|---|
| `Pick<T, K>` | пакідае **толькі** пералічаныя палі | `Pick<Applicant, "fullName" \| "email">` → `{ fullName: string; email: string }` |
| `Omit<T, K>` | **выключае** пералічаныя палі, пакідае астатнія | `Omit<Applicant, "phone">` → `{ fullName: string; email: string }` |
| `Partial<T>` | робіць **усе** палі неабавязковымі (`?`) | зручна для "патч"-абнаўленняў: `Partial<Applicant>` |
| `Required<T>` | робіць **усе** палі абавязковымі (прыбірае `?`) | `Required<Applicant>` — тут `phone` ужо не неабавязковы |
| `Readonly<T>` | робіць **усе** палі `readonly` | `Readonly<Applicant>` |

```ts
type ApplicantPreview = Pick<Applicant, "fullName" | "email">;
type ApplicantWithoutPhone = Omit<Applicant, "phone">;
type ApplicantPatch = Partial<Applicant>;      // усё неабавязковае
type StrictApplicant = Required<Applicant>;    // усё абавязковае
type FrozenApplicant = Readonly<Applicant>;    // нельга перазапісаць палі
```

### Увага: `Omit`/`Pick` — гэта не тое самае, што `Exclude`/`Extract`

`Omit` і `Pick` працуюць з **назвамі палёў аб'екта** (`keyof`). `Exclude` і `Extract` працуюць з **union-тыпамі** (наборам магчымых значэнняў, не палямі аб'екта):

```ts
type Status = "draft" | "published" | "archived";

type ActiveStatus = Exclude<Status, "archived">;   // "draft" | "published"
type ArchivedOnly = Extract<Status, "archived">;   // "archived"
```

Правіла, каб не блытаць: калі "выключаеш" **поле з інтэрфейсу** — гэта `Omit`. Калі "выключаеш" **варыянт з union** — гэта `Exclude`.

---

## 8. Практыкаванні

Рабіце ў асобным `.ts`-файле (або ў [TypeScript Playground](https://www.typescriptlang.org/play)) і правярайце, ці кампілюецца код без памылак тыпаў.

1. **Просты інтэрфейс.**
   Апішыце `interface Skill` з палямі `name: string` і `level: number`. Стварыце масіў з трох аб'ектаў гэтага тыпу.

2. **Generic-інтэрфейс.**
   Апішыце `interface Paginated<T>` з палямі `items: T[]` і `total: number`. Выкарыстайце яго як тып пераменнай `Paginated<Skill>`, дзе `Skill` — з практыкавання 1.

3. **`keyof`.**
   Напішыце функцыю `getField<T, K extends keyof T>(obj: T, key: K): T[K]`, якая прымае аб'ект і назву поля, і вяртае значэнне гэтага поля. Праверце на аб'екце `Skill`.

4. **Абмежаванне generic (`extends`).**
   Напішыце функцыю `hasName<T extends { name: string }>(item: T): boolean`, якая вяртае `true`, калі поле `name` непустое. Праверце яе на аб'екце `Skill` і на любым іншым аб'екце з полем `name`.

5. **Знайдзіце памылку.**
   У наступным кодзе ёсць памылка тыпаў — знайдзіце і выпраўце яе, не мяняючы `interface`:

   ```ts
   interface Certification {
     title: string;
     year: number;
   }

   const cert: Certification = {
     title: "AWS Certified",
     year: "2023",
   };
   ```

6. **Складанае (па матывах `orchestratot.ts`).**
   Апішыце `interface ValidationResult<T>` з палямі `valid: boolean` і `errors: (keyof T)[]`. Напішыце функцыю
   `validate<T extends object>(obj: T, required: (keyof T)[]): ValidationResult<T>`,
   якая правярае, ці ўсе палі з `required` маюць непустое значэнне ў `obj` (падобна на тое, як гэта робіць `checkStateOfCV` у арыгінальным файле).

---

## 9. Новыя паняцці для наступнага набору

- **Неабавязковыя палі (`?`)**: `interface Foo { bar?: string }` — поле можа адсутнічаць увогуле (тып становіцца `string | undefined`).
- **`readonly`**: `interface Foo { readonly id: string }` — поле можна прачытаць, але нельга перазапісаць пасля стварэння аб'екта.
- **`interface extends interface`**: адзін інтэрфейс можа пашыраць другі — `interface B extends A { extra: string }`, і `B` атрымлівае ўсе палі `A` плюс свае.
- **Index signature**: `interface Dict { [key: string]: number }` — апісвае аб'ект з невядомай наперад колькасцю ключоў аднолькавага тыпу значэння.
- **Callable interface**: інтэрфейс можа апісваць не толькі аб'ект, але і **функцыю** — `interface Fn { (x: number): boolean }`.

## 10. Практыкаванні — набор 2

7. **Optional і readonly.**
   Апішыце `interface Language` з палямі: `readonly code: string` (напр. `"en"`), `name: string`, і неабавязковым `level?: string`. Стварыце адзін аб'ект без `level` і адзін з `level`. Паспрабуйце пасля стварэння аб'екта перазапісаць `code` — пераканайцеся, што TypeScript гэта забараняе.

8. **`interface extends interface`.**
   Апішыце `interface Contact` з палямі `email: string` і неабавязковым `phone?: string`. Потым апішыце `interface Applicant extends Contact` з дадатковым полем `fullName: string`. Стварыце аб'ект тыпу `Applicant`, які змяшчае ўсе чатыры палі.

9. **Index signature.**
   Апішыце generic-інтэрфейс `interface Dictionary<T> { [key: string]: T }`. Выкарыстайце яго для тыпу `Dictionary<number>`, дзе ключы — назвы навыкаў (`"typescript"`, `"react"`), а значэнні — узровень (лічба). Напішыце функцыю `sumValues(dict: Dictionary<number>): number`, якая сумуе ўсе значэнні.

10. **Callable interface.**
    Апішыце `interface Validator<T> { (value: T): boolean }` — інтэрфейс апісвае функцыю, а не аб'ект. Стварыце канкрэтную зменную `const isPositive: Validator<number> = (value) => value > 0;` і выкарыстайце яе.

11. **Знайдзіце памылку.**
    У наступным кодзе ёсць памылка тыпаў — знайдзіце і выпраўце яе, не мяняючы інтэрфейсы:

    ```ts
    interface Education {
      readonly institution: string;
      degree: string;
      graduationYear?: number;
    }

    function describe(edu: Education): string {
      edu.institution = "Updated University";
      return `${edu.degree} (${edu.institution})`;
    }
    ```

12. **Складанае (аб'яднанне ўсяго).**
    Апішыце `interface Experience` з палямі `company: string`, `role: string`, `readonly startYear: number`, неабавязковым `endYear?: number`. Потым апішыце `interface ExperienceList extends Paginated<Experience>` (выкарыстайце `Paginated<T>` з набору 1, без залішняга абмежавання). Напішыце функцыю
    `filterOngoing<T extends { endYear?: number }>(items: T[]): T[]`,
    якая вяртае толькі тыя запісы, дзе `endYear` не вызначаны (г.зн. чалавек яшчэ там працуе).

---

## 11. Практыкаванні — набор 3 (пашырэнне і выключэнне)

13. **Множнае пашырэнне.**
    Апішыце `interface Timestamped { createdAt: string }` і `interface Named { name: string }`. Апішыце `interface Task extends Timestamped, Named { done: boolean }`. Стварыце аб'ект гэтага тыпу.

14. **Пашырэнне generic-інтэрфейсу.**
    Выкарыстоўваючы `Paginated<T>` з набору 1, апішыце `interface SearchResult<T> extends Paginated<T> { query: string }`. Стварыце `SearchResult<Skill>` (дзе `Skill` — з набору 1) з нейкім тэкстам запыту.

15. **`class ... implements`.**
    Апішыце `interface Greeter { greet(name: string): string }`. Напішыце клас `EnglishGreeter implements Greeter` і клас `FormalGreeter implements Greeter` з рознымі рэалізацыямі `greet`. Выклічце абодва.

16. **`Pick` і `Omit`.**
    Маючы `interface Applicant { fullName: string; email: string; phone?: string }`, стварыце тып `ApplicantPreview` (толькі `fullName` і `email`, праз `Pick`) і тып `ApplicantWithoutPhone` (усё, акрамя `phone`, праз `Omit`). Стварыце па адным аб'екце кожнага тыпу.

17. **`Partial`/`Required`/`Readonly`.**
    Выкарыстоўваючы той жа `Applicant`, напішыце функцыю `updateApplicant(current: Applicant, patch: Partial<Applicant>): Applicant`, якая вяртае новы аб'ект з абноўленымі палямі (падказка: `{ ...current, ...patch }`). Асобна стварыце тып `FrozenApplicant = Readonly<Applicant>` і пераканайцеся, што яго палі нельга перазапісаць.

18. **Знайдзіце памылку (`Exclude` vs `Omit`).**
    У наступным кодзе аўтар пераблытаў `Exclude` і `Omit` — знайдзіце і выпраўце:

    ```ts
    interface Applicant {
      fullName: string;
      email: string;
      phone?: string;
    }

    type ApplicantWithoutPhone = Exclude<Applicant, "phone">;
    ```
