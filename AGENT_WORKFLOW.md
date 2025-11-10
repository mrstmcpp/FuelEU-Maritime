# AI Agent Workflow Log

## Agents Used
- **ChatGPT** - Used for understanding and asking best practices which should be followed, also code refractoring and alternatives. Assisted in refactoring Prisma schema and writing ts entity models.
- **Github Copilot** - Inline completions and suggestions during writing code.
- **Cursor IDE Agent** - Used generally for file refractorings.


### Prompts 
**Prompts Used**
- **Cursor IDE AGENT** - `setup a basic backend inside `src/infrastructure/server` with nodejs and typescript + progresql prisma backed also ensure hexagonal archi from given image. `
![InitialSetup](https://i.postimg.cc/VktxQkv6/Screenshot-2025-11-10-094923.png)
- **Cursor IDE AGENT** - `requested not to use user as entity & instructed to use provided image as db schema . `
![db schema setup](https://i.postimg.cc/t4r2c0tg/Screenshot-2025-11-10-095454.png)
- **ChatGPT** - Provided schema.ts & instructed to `use ship as a entity and reference others tables from that ShipId as FK. also use decimal instead of float ` 
```
model Ship {
  id            Int              @id @default(autoincrement())
  shipId        Int              @unique @map("ship_id")
  createdAt     DateTime         @default(now()) @map("created_at")
  updatedAt     DateTime         @updatedAt @map("updated_at")
  
  compliance    ShipCompliance[]
  bankEntries   BankEntry[]
  poolMembers   PoolMember[]

  @@map("ships")
}
```

```
model ShipCompliance {
  id         Int      @id @default(autoincrement())
  shipId     Int      @map("ship_id")
  year       Int
  cbGco2eq   Decimal  @map("cb_gco2eq") // precision
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  ship       Ship     @relation("ShipComplianceShip", fields: [shipId], references: [shipId], onDelete: Cascade)

  @@map("ship_compliance")
  @@unique([shipId, year])
  @@index([shipId, year])
}
```

- ** ChatGPT ** - `generate core entities interfaces and repositories based on schema we just finalized`

```
export interface Route {
  id: number;
  routeId: string;
  year: number;
  ghgIntensity: number; // Decimal in DB
  isBaseline: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```
```
import { Route } from "../domain/route.entity";

export interface IRouteRepository {
  findAll(): Promise<Route[]>;
  findByYear(year: number): Promise<Route[]>;
  findById(id: number): Promise<Route | null>;
  findByRouteId(routeId: string): Promise<Route | null>;
  setBaseline(routeId: string): Promise<Route>;
  findBaselines(): Promise<Route[]>;
  create(data: Omit<Route, "id" | "createdAt" | "updatedAt">): Promise<Route>;
}

```
- **Github Copilot** - Took help of copilot for inline code complettion and implemented each repository in outbound/prisma.
- **ChatGPT** - Provided seed data given in assingment to chatgpt and `write a seed.ts for seeding data to db. make sure you follow the actual schema. also add console logs`

```
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const routes = [
    { routeId: "R001", year: 2024, ghgIntensity: 91.0, isBaseline: true },
    { routeId: "R002", year: 2024, ghgIntensity: 88.0, isBaseline: false },
    { routeId: "R003", year: 2024, ghgIntensity: 93.5, isBaseline: false },
    { routeId: "R004", year: 2025, ghgIntensity: 89.2, isBaseline: false },
    { routeId: "R005", year: 2025, ghgIntensity: 90.5, isBaseline: false },
  ];

  await prisma.route.deleteMany();

  for (const route of routes) {
    await prisma.route.create({ data: route });
  }

  console.log("✅ Seed data inserted into 'routes' table successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- **Cursor** - Wasn't able to run seeding migration. Asked cursor to fix it. 
`REASON : missing import inside prisma.config.ts`
```
import dotenv from "dotenv";

dotenv.config();
```
Still not fixed hence instructed
`Can you check the imports inside prisma configs nd check scripts once in package json ?` 
[![image.png](https://i.postimg.cc/0QYh4kky/image.png)](https://postimg.cc/MMGsM8fC)

- **Cursor** - `Can you help me to write unit test for the route.service.ts inside src/core/application/services? use data which i m providing you.`
```
import { RouteService } from "../core/application/services/route.service";
import type { IRouteRepository } from "../core/ports/route.repository.port";
import type { Route } from "../core/domain/route.entity";

function makeRoute(partial: Partial<Route>): Route {
  return {
    id: partial.id ?? 0,
    routeId: partial.routeId ?? "R-UNKNOWN",
    year: partial.year ?? 2024,
    ghgIntensity: partial.ghgIntensity ?? 0,
    isBaseline: partial.isBaseline ?? false,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
  };
}

class MockRouteRepository implements IRouteRepository {
  private routes: Route[];
  constructor(initialRoutes: Route[]) {
    this.routes = initialRoutes;
  }
  async findAll(): Promise<Route[]> {
    return this.routes;
  }
  async findByYear(year: number): Promise<Route[]> {
    return this.routes.filter(r => r.year === year);
  }
  async findById(id: number): Promise<Route | null> {
    return this.routes.find(r => r.id === id) ?? null;
  }
  async findByRouteId(routeId: string): Promise<Route | null> {
    return this.routes.find(r => r.routeId === routeId) ?? null;
  }
  async setBaseline(routeId: string): Promise<Route> {
    const idx = this.routes.findIndex(r => r.routeId === routeId);
    if (idx === -1) throw new Error("Route not found");
    this.routes = this.routes.map(r => ({ ...r, isBaseline: false }));
    this.routes[idx] = { ...this.routes[idx]!, isBaseline: true };
    return this.routes[idx]!;
  }
  async findBaselines(): Promise<Route[]> {
    return this.routes.filter(r => r.isBaseline);
  }
  async create(data: Omit<Route, "id" | "createdAt" | "updatedAt">): Promise<Route> {
    const created: Route = {
      ...data,
      id: this.routes.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.routes.push(created);
    return created;
  }
}

async function run() {
  let passed = 0;
  let failed = 0;
  const assert = (cond: boolean, name: string, extra?: unknown) => {
    if (cond) {
      passed++;
      console.log(`PASS ${name}`);
    } else {
      failed++;
      console.error(`FAIL ${name}`, extra ?? "");
    }
  };

  // Fixture data
  const routes: Route[] = [
    makeRoute({ id: 1, routeId: "R001", year: 2024, ghgIntensity: 91.0, isBaseline: true }),
    makeRoute({ id: 2, routeId: "R002", year: 2024, ghgIntensity: 88.0 }),
    makeRoute({ id: 3, routeId: "R003", year: 2025, ghgIntensity: 93.5 }),
  ];
  const repo = new MockRouteRepository(routes);
  const service = new RouteService(repo);

  // getAllRoutes
  {
    const all = await service.getAllRoutes();
    assert(all.length === 3, "getAllRoutes returns all routes");
  }

  // setBaseline
  {
    const updated = await service.setBaseline("R002");
    assert(updated.isBaseline === true && updated.routeId === "R002", "setBaseline switches baseline to R002");
    const baselines = await repo.findBaselines();
    assert(baselines.length === 1, "only one baseline exists after setBaseline");
    assert(baselines[0]!.routeId === "R002", "baseline routeId is R002");
  }

  // compareRoutes with baseline present
  {
    const result = await service.compareRoutes();
    const r002 = result.find(r => r.routeId === "R002");
    const r001 = result.find(r => r.routeId === "R001");
    const r003 = result.find(r => r.routeId === "R003");
    assert(!!r002 && Math.abs(r002.percentDiff) < 1e-10, "compareRoutes baseline percentDiff is ~0");
    assert(!!r001, "compareRoutes returns other routes too");
    assert(!!r003, "compareRoutes returns all routes");
    if (r001) {
      const expected = ((91.0 / 88.0) - 1) * 100;
      assert(Math.abs(r001.percentDiff - expected) < 1e-10, "compareRoutes percentDiff matches expected", { got: r001.percentDiff, expected });
    }
    if (r002) {
      assert(r002.compliant === (88.0 <= 89.3368), "compareRoutes compliant logic uses targetIntensity");
    }
  }

  // compareRoutes without baseline should throw
  {
    const repoNoBaseline = new MockRouteRepository([
      makeRoute({ id: 10, routeId: "X1", ghgIntensity: 90, isBaseline: false }),
      makeRoute({ id: 11, routeId: "X2", ghgIntensity: 91, isBaseline: false }),
    ]);
    const svcNoBaseline = new RouteService(repoNoBaseline);
    let threw = false;
    try {
      await svcNoBaseline.compareRoutes();
    } catch {
      threw = true;
    }
    assert(threw, "compareRoutes throws when no baseline is set");
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error("Unexpected error in test runner:", err);
  process.exitCode = 1;
});

```
- **ChatGPT** - `use a shared constants.ts so that i can add all business variables and constants there making it easier to change.`
```
export const CONSTANTS = {
  // ⚙️ FuelEU Maritime Parameters
  TARGET_INTENSITY_GCO2E_PER_MJ: 89.3368,  // 2025 target (gCO2e/MJ)
  DEFAULT_TARGET_YEAR: 2025,

  // 🧮 Physical Constants
  ENERGY_FACTOR_MJ_PER_TON: 41000, // 1 ton fuel = 41,000 MJ
  CARBON_INTENSITY_UNIT: "gCO2e/MJ",

  // 💰 Banking Rules
  BANKING_MAX_YEARS_FORWARD: 2, // Can bank surplus up to 2 years ahead
  BANKING_MIN_SURPLUS_THRESHOLD: 0, // only positive CBs can be banked

  // 🧾 Pooling Rules
  POOL_MIN_TOTAL_CB_REQUIRED: 0, // Σ CB must be >= 0 to form a valid pool
} as const;

```
- **ChatGPT** - It was writing test codes using raw js logics. So, i instructed to use Jest for unit testings. `Hey bro u can use jest for unit testing . lets write again our route nd compliance tests.`
- **ChatGPT & Copilot inline completion** - errors in repository due to queryign data using composite key. Instructed chatgpt to `fix this code also providiing you my original schema`.
Chatgtp gave two method to fix one by modifying schema & other by using findFirst in the prisma orm
`what would be best practice of industry standard?`
finnally, modiified schema . here is the snippet =>
```
@@unique([shipId, year], name: "shipId_year")
```
modified rest needed schemas like this.

- **ChatGPT** - `can you help me to write controller for route service with routes and controllers as seperate layers. write only GET /routes -> for fetching all routes & POST /routes/:id/baseline to set baseline & GET /routes/comparison baseline vs others where percentDiff and compliant are the flags???`
```
getAllRoutes = async (req: Request, res: Response): Promise<void> => {
    try {
      const routes = await this.routeService.getAllRoutes();
      res.status(200).json({ success: true, data: routes });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
```

```
const router = Router();

const repo = new PrismaRouteRepository();
const service = new RouteService(repo);
const controller = new RouteController(service);

router.get("/", controller.getAllRoutes);
router.post("/:id/baseline", controller.setBaseline);
router.get("/comparison", controller.compareRoutes);

export default router;
```
- **ChatGPT + Copilot** - was using decimal for storing carbon emissions data for more acccuracy instead of float. Bt getting errors in type conversions for prisma and repository. so, provided code to chatgpt
`what there is type mismatch in repos and solve that return error`
```
type AnyObject = Record<string, unknown>;

export function toNumberFields<T extends AnyObject>(
  obj: T,
  keys: (keyof T)[]
): T {
  const clone = { ...obj };

  for (const key of keys) {
    const val = clone[key];

    if (val != null && typeof val === "object" && "toNumber" in (val as any)) {
      // Prisma.Decimal object → call .toNumber()
      (clone as any)[key] = (val as any).toNumber();
    } else if (typeof val === "string" || typeof val === "number") {
      (clone as any)[key] = Number(val);
    }
  }

  return clone;
}

export function toNumberFieldsArray<T extends AnyObject>(
  arr: T[],
  keys: (keyof T)[]
): T[] {
  return arr.map((obj) => toNumberFields(obj, keys));
}

```



