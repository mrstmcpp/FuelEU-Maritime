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

