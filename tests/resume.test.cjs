/* eslint-disable @typescript-eslint/no-require-imports -- Node's dependency-free CommonJS test runner. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
// Compile the actual TypeScript source in memory; no generated files in the repo.
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    filename,
  );
const {
  createLibrary,
  parseLibrary,
  blankResume,
  isResumeData,
} = require("../lib/resume-library.ts");
const { defaultAppearance } = require("../lib/resume-appearance.ts");
const { checkResume } = require("../lib/resume-checks.ts");
test("backup roundtrip preserves content, ordering, hidden sections and appearance", () => {
  const library = createLibrary();
  library.documents[0].data.hiddenSections = ["summary"];
  library.documents[0].data.appearance = {
    ...defaultAppearance,
    fontSize: 13.5,
  };
  assert.deepEqual(parseLibrary(JSON.stringify(library)), library);
});
test("new blank resume is complete schema and never inherits sample personal data", () => {
  const data = blankResume();
  assert.equal(isResumeData(data), true);
  assert.equal(data.name, "");
  assert.deepEqual(data.workExperiences, []);
});
test("malformed or future-version backups are rejected", () => {
  for (const raw of [
    "not json",
    "{}",
    "null",
    JSON.stringify({ ...createLibrary(), version: 2 }),
  ])
    assert.throws(() => parseLibrary(raw));
});
test("incomplete imported nested items cannot reach rendering", () => {
  for (const section of [
    "workExperiences",
    "projects",
    "educations",
    "skills",
  ]) {
    const library = createLibrary();
    library.documents[0].data[section] = [{ id: "bad" }];
    assert.throws(() => parseLibrary(JSON.stringify(library)));
  }
});
test("unknown, duplicate or missing section keys are rejected", () => {
  for (const order of [
    ["summary"],
    ["summary", "summary", "summary", "summary", "summary"],
    ["summary", "workExperiences", "projects", "educations", "unknown"],
  ]) {
    const data = blankResume();
    data.sectionOrder = order;
    assert.equal(isResumeData(data), false);
  }
});
test("active document must exist and cannot be archived", () => {
  const missing = createLibrary();
  missing.activeId = "missing";
  assert.throws(() => parseLibrary(JSON.stringify(missing)));
  const archived = createLibrary();
  archived.documents[0].archived = true;
  assert.throws(() => parseLibrary(JSON.stringify(archived)));
});
test("duplicate document and entry IDs are rejected", () => {
  const library = createLibrary();
  library.documents.push(structuredClone(library.documents[0]));
  assert.throws(() => parseLibrary(JSON.stringify(library)));
  const data = createLibrary().documents[0].data;
  data.workExperiences.push(structuredClone(data.workExperiences[0]));
  assert.equal(isResumeData(data), false);
});
test("unsafe avatar URLs and invalid appearance values are rejected", () => {
  for (const avatar of [
    "https://tracker.invalid/a.png",
    "javascript:alert(1)",
    "data:image/svg+xml;base64,PHN2Zz4=",
  ]) {
    const data = blankResume();
    data.avatar = avatar;
    assert.equal(isResumeData(data), false);
  }
  for (const patch of [
    { fontSize: 100 },
    { template: "unknown" },
    { accent: "url(x)" },
    { spacing: "unknown" },
  ]) {
    const data = blankResume();
    data.appearance = { ...defaultAppearance, ...patch };
    assert.equal(isResumeData(data), false);
  }
});
test("resume checks ignore intentionally hidden sections", () => {
  const data = blankResume();
  const before = checkResume(data);
  data.hiddenSections = ["workExperiences"];
  const after = checkResume(data);
  assert.ok(before.some((c) => c.section === "workExperiences"));
  assert.ok(after.every((c) => c.section !== "workExperiences"));
});
test("date checks detect reversed dates but permit current employment", () => {
  const data = createLibrary().documents[0].data;
  data.workExperiences[0].current = false;
  data.workExperiences[0].endDate = "2000-01";
  assert.equal(
    checkResume(data).find((c) => c.id === "dates-workExperiences").passed,
    false,
  );
  data.workExperiences[0].current = true;
  assert.equal(
    checkResume(data).find((c) => c.id === "dates-workExperiences").passed,
    true,
  );
});
test("new libraries do not share mutable default data", () => {
  const a = createLibrary();
  const b = createLibrary();
  a.documents[0].data.name = "changed";
  a.documents[0].data.skills = [];
  assert.notEqual(a.documents[0].data.name, b.documents[0].data.name);
  assert.ok(b.documents[0].data.skills.length);
});
const { pdfPageSlices } = require("../lib/pdf-pagination.ts");
const { libraryReducer } = require("../lib/resume-history.ts");
const history = () => ({
  library: createLibrary(),
  past: [],
  future: [],
  ready: true,
  groupAt: 0,
});
const edit = (name, at = 1000, group = false) => ({
  type: "edit",
  update: (library) => ({
    ...library,
    documents: library.documents.map((d) => ({ ...d, name })),
  }),
  at,
  group,
});
test("exact A4 canvas exports one page instead of a 1px blank second page", () => {
  assert.deepEqual(pdfPageSlices(2246, 1588), [{ start: 0, end: 2246 }]);
});
test("long PDF keeps all pixels exactly once and preserves text lines at page breaks", () => {
  const slices = pdfPageSlices(5000, 1588, [{ top: 2230, bottom: 2255 }]);
  assert.equal(slices[0].end, 2228);
  assert.equal(slices.at(-1).end, 5000);
  for (let i = 1; i < slices.length; i++)
    assert.equal(slices[i].start, slices[i - 1].end);
  assert.equal(
    slices.reduce((sum, s) => sum + s.end - s.start, 0),
    5000,
  );
});
test("PDF tolerates a two-pixel rounding remainder", () => {
  assert.equal(pdfPageSlices(2248, 1588).length, 1);
  assert.equal(pdfPageSlices(2249, 1588).length, 2);
});
test("undo and redo restore exact document snapshots", () => {
  const initial = history();
  const changed = libraryReducer(initial, edit("modified"));
  const undone = libraryReducer(changed, { type: "undo" });
  assert.deepEqual(undone.library, initial.library);
  assert.deepEqual(
    libraryReducer(undone, { type: "redo" }).library,
    changed.library,
  );
});
test("typing is grouped while separated edits have separate undo entries", () => {
  let state = libraryReducer(history(), edit("A", 1000, true));
  state = libraryReducer(state, edit("AB", 1200, true));
  assert.equal(state.past.length, 1);
  state = libraryReducer(state, edit("ABC", 2000, true));
  assert.equal(state.past.length, 2);
});
test("editing after undo discards redo branch", () => {
  let state = libraryReducer(history(), edit("A"));
  state = libraryReducer(state, { type: "undo" });
  state = libraryReducer(state, edit("B"));
  assert.equal(state.future.length, 0);
});
test("queued mutations apply to latest library rather than overwriting intervening documents", () => {
  let state = history();
  const first = state.library.activeId;
  const pendingAvatar = {
    type: "edit",
    at: 3000,
    group: false,
    update: (library) => ({
      ...library,
      documents: library.documents.map((d) =>
        d.id === first
          ? { ...d, data: { ...d.data, avatar: "data:image/jpeg;base64,YQ==" } }
          : d,
      ),
    }),
  };
  state = libraryReducer(state, {
    type: "edit",
    at: 2000,
    group: false,
    update: (library) => ({
      ...library,
      activeId: "new",
      documents: [
        ...library.documents,
        { id: "new", name: "New", updatedAt: "", data: blankResume() },
      ],
    }),
  });
  state = libraryReducer(state, pendingAvatar);
  assert.equal(state.library.documents.length, 2);
  assert.equal(state.library.activeId, "new");
  assert.equal(
    state.library.documents[0].data.avatar,
    "data:image/jpeg;base64,YQ==",
  );
});
test("history memory is bounded", () => {
  let state = history();
  for (let i = 0; i < 100; i++)
    state = libraryReducer(state, edit(String(i), 1000 * i));
  assert.equal(state.past.length, 40);
});
test("100 entries roundtrip but 101 entries are rejected", () => {
  const data = blankResume();
  data.skills = Array.from({ length: 100 }, (_, i) => ({
    id: String(i),
    category: "category",
    items: "item",
  }));
  assert.equal(isResumeData(data), true);
  data.skills.push({ id: "100", category: "category", items: "item" });
  assert.equal(isResumeData(data), false);
});

test("legacy blue and slate accents migrate to green shades without losing resume data", () => {
  for (const [legacy, expected] of [
    ["blue", "fresh"],
    ["slate", "forest"],
  ]) {
    const library = createLibrary();
    library.documents[0].data.appearance = {
      ...defaultAppearance,
      accent: legacy,
    };
    const parsed = parseLibrary(JSON.stringify(library));
    assert.equal(parsed.documents[0].data.appearance.accent, expected);
    assert.equal(parsed.documents[0].data.name, library.documents[0].data.name);
    assert.deepEqual(
      parsed.documents[0].data.workExperiences,
      library.documents[0].data.workExperiences,
    );
  }
});

test("all current accent settings survive backup roundtrip", () => {
  for (const accent of ["green", "fresh", "forest"]) {
    const library = createLibrary();
    library.documents[0].data.appearance = { ...defaultAppearance, accent };
    assert.deepEqual(parseLibrary(JSON.stringify(library)), library);
  }
});
