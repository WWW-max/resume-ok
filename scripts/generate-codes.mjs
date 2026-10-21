import { randomBytes } from "node:crypto";
import pg from "pg";

const PLAN_CONFIG = {
  monthly: { prefix: "M30", days: 30, label: "月卡 (30天)" },
  quarterly: { prefix: "Q90", days: 90, label: "季卡 (90天)" },
  yearly: { prefix: "Y365", days: 365, label: "年卡 (365天)" },
};

const planArg = (process.argv[2] || "quarterly").toLowerCase();
const countArg = Math.min(500, Math.max(1, Number(process.argv[3] || 10)));
const noteArg = process.argv[4] || "命令行批量生成";

if (!PLAN_CONFIG[planArg]) {
  console.error(
    "用法: pnpm run codes:generate [monthly|quarterly|yearly] [数量] [备注]",
  );
  process.exit(1);
}

const { prefix, days, label } = PLAN_CONFIG[planArg];
const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomSegment(len = 4) {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

try {
  const generated = [];
  for (let i = 0; i < countArg; i++) {
    const code = `ROK-${prefix}-${randomSegment(4)}-${randomSegment(4)}`;
    await pool.query(
      `INSERT INTO redemption_codes (code, plan_type, duration_days, batch_note)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO NOTHING`,
      [code, planArg, days, noteArg],
    );
    generated.push(code);
  }
  console.log(`\n✅ 已成功生成 ${generated.length} 个【${label}】激活码：\n`);
  for (const code of generated) {
    console.log(code);
  }
  console.log("");
} finally {
  await pool.end();
}
