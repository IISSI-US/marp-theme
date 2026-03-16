---
marp: true
theme: dr-iissi
marp-theme-rel-dir: ..
paginate: true
---

<!-- _class: title -->

# `dr-iissi` Theme Guide

## Usage reference and visual regression deck

### IISSI Marp theme

---

<!-- _class: content -->

# What this deck is for

- Learn how to use the `dr-iissi` theme in real slides.
- See the supported layout patterns and content conventions.
- Verify typography, code blocks, math, image framing, footer, and pagination.
- Use the later sections as a visual regression deck after theme or engine changes.

---

<!-- _class: default -->

# Quick start

Use the theme with Marp CLI:

```bash
marp --theme-set ./css/dr-iissi.css --engine ./scripts/marp-engine.js slide.md --pdf
```

Recommended front matter in a deck that lives outside `marp-theme/`:

```yaml
---
marp: true
theme: dr-iissi
marp-theme-rel-dir: ../../marp-theme
paginate: true
size: 16:9
---
```

---

<!-- _class: default -->

# Theme-specific front matter

`marp-theme-rel-dir` tells the engine where theme assets live relative to the current markdown file.

- In this guide the value is `..`
- In `iissi-1/t*/...md` files the value is `../../marp-theme`
- Use a relative path so PDF builds stay portable across machines

If the path is wrong, background images and local fonts may not resolve during render.

---

<!-- _class: default -->

# Column marker rules

For `two-col`, `two-col-3-7`, `two-col-7-3`, and `three-col`:

1. Use `*** left ***` to start the left column.
2. Use `*** right ***` to start the right column.
3. Use `*** center ***` only in `three-col`.
4. Do not use `<hr/>` inside column layouts.

Optional: add `v-align` to vertically center the slide body.

The engine inserts the needed blank line after each column marker automatically, so the next block can start immediately.

---

<!-- _class: content -->

# Guide map

- **Section 1. Typography and code fonts**
- Section 2. Base layouts and images
- Section 3. Vertical alignment
- Section 4. `mr`, `sql`, and KaTeX
- Section 5. Visual regression cases A-J
- Section 6. Realistic topic examples T1-T12
- Section 7. Mixed regression cases K-N

---

<!-- _class: default font-roboto -->

# Theme font: default (`Roboto`)

This slide uses the default theme font.

- Accents and symbols: áéíóú ñ ç
- **Bold sample**
- *Italic sample*
- `Inline code sample`

---

<!-- _class: default font-lato -->

# Theme font override: `Lato`

Use slide classes such as `font-lato` when a deck needs a different tone without changing the whole theme.

- Paragraph rhythm sample
- **Bold sample**
- *Italic sample*
- `Inline code sample`

---

<!-- _class: default font-roboto-condensed -->

# Theme font override: `Roboto Condensed`

This variant is useful for denser titles or compact text blocks.

- Narrower letterforms
- Good for labels and summaries
- `Inline code sample`

---

<!-- _class: default font-source-sans-3 -->

# Theme font override: `Source Sans 3`

Use this slide to validate the local variable font and italic face.

- Normal text sample
- *Italic sample*
- **Bold sample**

---

<!-- _class: default font-caveat -->

# Theme font override: `Caveat`

This slide is intentionally distinctive so font loading issues are obvious.

- Handwritten tone sample
- Long enough sentence to inspect rhythm and contrast.
- **Bold sample**
- *Italic sample*

---

<!-- _class: default -->

# Code font: default stack

Default code blocks use the theme monospace stack.

```sql default
SELECT
  d.nombre AS departamento,
  e.id_emp,
  e.nombre,
  e.salario,
  ROW_NUMBER() OVER (
    PARTITION BY d.id_dept
    ORDER BY e.salario DESC
  ) AS orden_salario
FROM Empleado e
JOIN Departamento d ON d.id_dept = e.id_dept
WHERE e.salario IS NOT NULL
ORDER BY d.nombre, orden_salario;
```

---

<!-- _class: default -->

# Code font: `JetBrains Mono`

The engine supports a local JetBrains Mono variant through the fence info string.

```mr jetbrains
Empleado(PK id_emp, nombre, salario, FK id_dept null)
Departamento(PK id_dept, nombre AK, presupuesto)
Proyecto(PK id_proy, nombre, FK id_dept)
Asignacion(PK id_emp, PK id_proy, horas, fecha_inicio)
```

```sql jetbrains
SELECT e.nombre, p.nombre, a.horas
FROM Asignacion a
JOIN Empleado e ON e.id_emp = a.id_emp
JOIN Proyecto p ON p.id_proy = a.id_proy
WHERE a.horas >= 20
ORDER BY a.horas DESC, e.nombre;
```

---

<!-- _class: default -->

# Code fence selectors

Pick the code font in the fence info string:

- `default` or `consolas` for the default monospace stack
- `jetbrains` or `jb` for `JetBrains Mono`

Examples:

` ```sql default `
`SELECT * FROM Empleado;`
` ``` `

` ```mr jetbrains `
`Empleado(PK id_emp, nombre)`
` ``` `

---

<!-- _class: content -->

# Guide map

- Section 1. Typography and code fonts
- **Section 2. Base layouts and images**
- Section 3. Vertical alignment
- Section 4. `mr`, `sql`, and KaTeX
- Section 5. Visual regression cases A-J
- Section 6. Realistic topic examples T1-T12
- Section 7. Mixed regression cases K-N

---

<!-- _class: default -->

# Layout: `default`

Standard single-column content slide.

- Main point one
- Main point two
- Subpoints can be nested
- Suitable for most explanatory slides

---

<!-- _class: default -->

# Headings: `h2`, `h3`, `h4`

## This is an `h2`

### This is an `h3`

#### This is an `h4`

Body text should remain readable below centered secondary headings.

---

<!-- _class: content -->

# Layout: `content`

- Use this style for agendas and section summaries
- The layout is intentionally lighter than `default`
- It works well with short, scannable bullet lists

---

<!-- _class: default -->

# Layout: `default` with a full image

![](./images/ejemplo-t2-ciclos-evolutivos.png)

---

<!-- _class: default -->

# Layout: `default` with text and image

- Text may appear before a framed image.
- Images should keep their box styling.
- Spacing should remain consistent.

![](./images/ejemplo-t2-ciclos-evolutivos.png)

---

<!-- _class: two-col -->

# Layout: `two-col`

*** left ***

**Left column**

Content for the first half.

- Item A
- Item B
- Item C

*** right ***

**Right column**

Content for the second half.

- Item D
- Item E
- Item F

---

<!-- _class: three-col -->

# Layout: `three-col`

*** left ***

**First column**

Text for column one.

*** center ***

**Second column**

Text for column two.

*** right ***

**Third column**

Text for column three.

---

<!-- _class: three-col -->

# Layout: text + code + image

*** left ***

Quick summary:

- Context
- Rule
- Conclusion

*** center ***

```sql
SELECT nombre, salario
FROM Empleados
WHERE salario > 2000;
```

*** right ***

![](./images/ejemplo-t7-relacion.png)

---

<!-- _class: three-col v-align -->

# Layout: `three-col v-align`

*** left ***

Vertically centered text.

*** center ***

```mr
Pedido(PK id_ped, FK id_cli)
Cliente(PK id_cli, nombre)
```

*** right ***

![](./images/ejemplo-t1-proyecto-software.png)

---

<!-- _class: two-col-3-7 -->

# Layout: `two-col-3-7`

*** left ***

Left column at 30%.

Short contextual content.

*** right ***

The right column gets the main space.

- Detailed point one
- Detailed point two
- Detailed point three

---

<!-- _class: two-col-7-3 -->

# Layout: `two-col-7-3`

*** left ***

The left column holds the main explanation.

- Main concept
- Supporting point
- Partial conclusion

*** right ***

The right column is suitable for notes or compact media.

---

<!-- _class: two-col -->

# Layout: image and text in 50/50

*** left ***

Text above an image.

![](./images/ejemplo-t1-proyecto-software.png)

*** right ***

- Feature A
- Feature B

---

<!-- _class: two-col-3-7 -->

# Layout: image-heavy `two-col-3-7`

*** left ***

![](./images/ejemplo-t6-generalizacion.png)

Caption-like text below the image.

*** right ***

- More detailed explanation
- Supporting note
- Closing point

---

<!-- _class: two-col -->

# Layout: text opposite image

*** left ***

Text at the left side of the image.

- Feature A
- Feature B

*** right ***

![](./images/ejemplo-t2-ciclos-evolutivos.png)

---

<!-- _class: two-col-7-3 -->

# Layout: text-heavy `two-col-7-3`

*** left ***

Primary explanation with more horizontal room.

- Point one
- Point two
- Point three

*** right ***

![](./images/ejemplo-t7-relacion.png)

---

<!-- _class: content -->

# Guide map

- Section 1. Typography and code fonts
- Section 2. Base layouts and images
- **Section 3. Vertical alignment**
- Section 4. `mr`, `sql`, and KaTeX
- Section 5. Visual regression cases A-J
- Section 6. Realistic topic examples T1-T12
- Section 7. Mixed regression cases K-N

---

<!-- _class: default v-align -->

# `v-align` on `default`

This block should appear vertically centered inside the slide body.

---

<!-- _class: content v-align -->

# `v-align` on `content`

- Item 1
- Item 2
- Item 3

---

<!-- _class: two-col v-align -->

# `v-align` on `two-col`

*** left ***

Text in the left column.

*** right ***

![](./images/ejemplo-t2-ciclos-evolutivos.png)

---

<!-- _class: two-col-3-7 v-align -->

# `v-align` on `two-col-3-7`

*** left ***

Short text.

*** right ***

```sql
SELECT *
FROM Empleados
WHERE salario > 2000;
```

---

<!-- _class: two-col-7-3 v-align -->

# `v-align` on `two-col-7-3`

*** left ***

```mr
Empleado(PK id_emp, nombre, FK id_dept)
Departamento(PK id_dept, nombre)
```

*** right ***

![](./images/ejemplo-t7-relacion.png)

---

<!-- _class: content -->

# Guide map

- Section 1. Typography and code fonts
- Section 2. Base layouts and images
- Section 3. Vertical alignment
- **Section 4. `mr`, `sql`, and KaTeX**
- Section 5. Visual regression cases A-J
- Section 6. Realistic topic examples T1-T12
- Section 7. Mixed regression cases K-N

---

<!-- _class: default -->

# `mr` code blocks

Minimal relational-model sample used to validate custom highlighting.

```mr
Empleado(PK id_emp, nombre, apellidos, salario, FK id_dept null)
Departamento(PK id_dept, nombre AK, presupuesto)
Proyecto(PK id_proy, nombre, FK id_dept)
Asignacion(PK id_emp, PK id_proy, horas, fecha_inicio)
```

---

<!-- _class: default -->

# `sql` code blocks

Longer SQL sample used to inspect indentation, wrapping, and readability.

```sql
SELECT
  e.id_emp,
  e.nombre,
  d.nombre AS departamento,
  e.salario
FROM Empleado e
JOIN Departamento d ON e.id_dept = d.id_dept
WHERE e.salario > 30000
  AND d.presupuesto >= 100000
ORDER BY d.nombre, e.salario DESC, e.nombre;
```

---

<!-- _class: default -->

# `python`, `javascript`, `html`, and `css` code blocks

Same code-block treatment as `mr` and `sql`, with distinct background colors.

```python
def salario_neto(bruto, retencion=0.15):
  return round(bruto * (1 - retencion), 2)
```

```javascript
const empleados = datos.filter((e) => e.salario > 30000);
console.log(empleados.map((e) => e.nombre));
```

```html
<section class="empleados">
  <h2>Departamento</h2>
  <p>Listado actualizado</p>
</section>
```

```css
.empleados {
  border: 2px solid #9f1732;
  padding: 0.75rem 1rem;
  background: #fff;
}
```

---

<!-- _class: two-col-3-7 -->

# `mr` + `sql` in columns

*** left ***

```mr
Empleado(PK id_emp, nombre, salario, FK id_dept null)
Departamento(PK id_dept, nombre AK, presupuesto)
Asignacion(PK id_emp, PK id_proy, horas)
```

*** right ***

```sql
SELECT
  e.nombre,
  d.nombre AS departamento,
  SUM(a.horas) AS total_horas
FROM Empleado e
JOIN Departamento d ON d.id_dept = e.id_dept
LEFT JOIN Asignacion a ON a.id_emp = e.id_emp
WHERE e.id_dept IS NOT NULL
GROUP BY e.nombre, d.nombre
HAVING SUM(a.horas) > 10
ORDER BY total_horas DESC, e.nombre;
```

---

<!-- _class: default -->

# KaTeX formulas

$$
\Proj_{\text{columns}}\!\left(\Sel_{\text{condition}}\!\left(T_1 \times T_2 \times \cdots \times T_n\right)\right)
$$

```sql
SELECT <column list>
FROM <T1, T2, ..., Tn>
WHERE <condition>
```

$$
\Proj_{\text{name},\text{salary}}\!\left(\Sel_{\text{salary}<2000}(Empleados)\right)
$$

```sql
SELECT nombre, salario
FROM Empleados
WHERE salario < 2000;
```

$$
\Group^{\text{P.de},\,\mathrm{count}(\text{Ped.id})}_{\text{P.de}}\!\left(Ped \NatJoin P\right)
$$

---

<!-- _class: default -->

# Algebra macros reference

Write display formulas with `$$ ... $$` and use:

- `\Proj_{...}` for projection
- `\Sel_{...}` for selection
- `\Ren_{...}` for renaming
- `\Group^{...}_{...}` for grouping and aggregation
- `\NatJoin`, `\JoinBy{...}` for joins
- `\Union`, `\Inter`, `\Diff` for set operators

---

<!-- _class: default -->

# Algebra macros source

```tex
\Proj_{nombre,salario}(Empleados)
\Sel_{salario>2000}(Empleados)
\Ren_{Emp}(Empleados)
\Group^{count(Ped.id)}_{P.de}(Ped \NatJoin P)
\Sel_{Emp.id=Dept.id}(Emp \JoinBy{\text{id}} Dept)
```

---

<!-- _class: default -->

# Algebra macros rendered

$$
\Proj_{\text{nombre},\text{salario}}(Empleados)
$$
$$
\Sel_{\text{salario}>2000}(Empleados)
$$
$$
\Ren_{\text{Emp}}(Empleados)
$$
$$
\Group^{\mathrm{count}(Ped.id)}_{\text{P.de}}(Ped \NatJoin P)
$$
$$
Emp \Union Dept,\quad Emp \Inter Dept,\quad Emp \Diff Dept
$$

---

<!-- _class: default -->

# Special characters and icons

Arrow examples: ➡️ ⬅️

Icon examples: 🎯🍽️🍴🧾

Algebra symbols: π σ ρ ≥ γ ∧ ∨

---

<!-- _class: content -->

# Guide map

- Section 1. Typography and code fonts
- Section 2. Base layouts and images
- Section 3. Vertical alignment
- Section 4. `mr`, `sql`, and KaTeX
- **Section 5. Visual regression cases A-J**
- Section 6. Realistic topic examples T1-T12
- Section 7. Mixed regression cases K-N

---

<!-- _class: default -->

# Visual regression coverage A-J

These slides are intended as regression probes.

They cover:

- image in left, right, or both columns
- text above and below framed images
- `two-col`, `two-col-3-7`, and `two-col-7-3`
- mixed cases with code and images
- image sizing and clipping behavior inside columns

---

<!-- _class: two-col-3-7 -->

# Test A: left image only

*** left ***

![](images/ejemplo-t1-proyecto-software.png)

*** right ***

Regular text in the right column to force height distribution.

- Line 1
- Line 2
- Line 3

---

<!-- _class: two-col-3-7 -->

# Test B: left image with text above

*** left ***

Text above the image.

![](images/ejemplo-t1-proyecto-software.png)

*** right ***

Control content in the right column.

---

<!-- _class: two-col-3-7 -->

# Test C: left image with text below

*** left ***

![](images/ejemplo-t1-proyecto-software.png)

Text below the image.

*** right ***

Control content in the right column.

---

<!-- _class: two-col-3-7 -->

# Test D: left image with text above and below

*** left ***

Text above the image.

![](images/ejemplo-t1-proyecto-software.png)

Text below the image.

*** right ***

Control content in the right column.

---

<!-- _class: two-col-7-3 -->

# Test E: right image only

*** left ***

Regular text in the left column to force height distribution.

- Line 1
- Line 2
- Line 3
- Line 4

*** right ***

![](images/ejemplo-t2-ciclos-evolutivos.png)

---

<!-- _class: two-col-7-3 -->

# Test F: right image with text above and below

*** left ***

Text on the left.

*** right ***

Text above the image.

![](images/ejemplo-t2-ciclos-evolutivos.png)

Text below the image.

---

<!-- _class: two-col-3-7 -->

# Test G: image in both columns

*** left ***

![](images/ejemplo-t1-proyecto-software.png)

Text below the left image.

*** right ***

Text above the right image.

![](images/ejemplo-t2-ciclos-evolutivos.png)

---

<!-- _class: two-col-7-3 -->

# Test H: image in both columns, inverted

*** left ***

Text above the left image.

![](images/ejemplo-t7-relacion.png)

*** right ***

![](images/ejemplo-t1-proyecto-software.png)

Text below the right image.

---

<!-- _class: two-col -->

# Test I: 50/50 with two images and text

*** left ***

Text above the left image.

![](images/ejemplo-t7-relacion.png)

Text below the left image.

*** right ***

Text above the right image.

![](images/ejemplo-t2-ciclos-evolutivos.png)

Text below the right image.

---

<!-- _class: two-col -->

# Test J: 50/50 with two images and text, inverted

*** left ***

Text above the left image.

![](images/ejemplo-t2-ciclos-evolutivos.png)

Text below the left image.

*** right ***

Text above the right image.

![](images/ejemplo-t1-proyecto-software.png)

Text below the right image.

---

<!-- _class: content -->

# Guide map

- Section 1. Typography and code fonts
- Section 2. Base layouts and images
- Section 3. Vertical alignment
- Section 4. `mr`, `sql`, and KaTeX
- Section 5. Visual regression cases A-J
- **Section 6. Realistic topic examples T1-T12**
- Section 7. Mixed regression cases K-N

---

<!-- _class: default -->

# Realistic topic examples T1-T12

These slides are not only usage examples.

They also validate that the theme remains usable with realistic content taken from the course topics:

- image-driven slides
- asymmetric columns
- `mr` and `sql` blocks
- formulas and diagrams

---

<!-- _class: two-col -->

# T1: software fundamentals

*** left ***

The software crisis appears when:

- projects become larger,
- technical complexity grows,
- engineering processes remain unclear.

*** right ***

![](../../iissi-1/t1-introduccion-a-la-ingenieria-del-software/images/el-software-01.png)

---

<!-- _class: two-col-3-7 -->

# T2: Scrum overview

*** left ***

Main roles and artifacts:

- `Product Owner`
- `Scrum Master`
- `Sprint Backlog`

*** right ***

![](../../iissi-1/t2-el-ciclo-de-vida-del-software/images/metodologia-scrum-01.png)

---

<!-- _class: default -->

# T3: information system components

An information system combines people, processes, data, and technology.

![](../../iissi-1/t3-introduccion-a-los-sistemas-de-informacion/images/componentes-de-un-sistema-de-informacion-01.png)

---

<!-- _class: default -->

# T4: data protection

Global overview of data protection regulation.

![](../../iissi-1/t4-legislacion/images/proteccion-datos-en-el-mundo-01.jpg)

---

<!-- _class: two-col-7-3 -->

# T5: user stories

*** left ***

Base structure:

> As a `<role>`, I want `<goal>` so that `<benefit>`.

Acceptance criteria should be:

- measurable,
- verifiable,
- value-oriented.

*** right ***

![](../../iissi-1/t5-requisitos-para-sistemas-de-informacion/images/historias-de-usuario-01.png)

---

<!-- _class: two-col -->

# T6: UML conceptual model

*** left ***

Class, attribute, and association notation in UML.

*** right ***

![](../../iissi-1/t6-introduccion-al-modelado-conceptual/images/ejemplo-de-clases-uml-01.png)

---

<!-- _class: default -->

# T7: functional dependencies

Dependency graph used to reason about candidate keys and normalization.

![](../../iissi-1/t7-introduccion-a-las-bbdd-y-al-mr/puml/t8-grafo-dependencias-funcionales.svg)

---

<!-- _class: two-col-3-7 -->

# T8: conceptual-to-relational mapping

*** left ***

```mr
Departamento(id_dep, nombre)
Empleado(id_emp, nombre, FK id_dep)
```

*** right ***

![](../../iissi-1/t8-transformacion-de-mc-en-mr/puml/transformacion-asociacion-1n.svg)

---

<!-- _class: default -->

# T9: relational algebra join

$$
\Proj_{\text{nombre},\text{salario}}
\left(
  Empleado \JoinBy{\text{Empleado.id\_dept}=\text{Departamento.id\_dept}} Departamento
\right)
$$

![](../../iissi-1/t9-introduccion-al-algebra-relacional/images/join.png)

---

<!-- _class: two-col-3-7 -->

# T10: SQL DDL and model

*** left ***

```sql
CREATE TABLE departamento (
  id_dept INT PRIMARY KEY,
  nombre  VARCHAR(40) NOT NULL
);
```

*** right ***

![](../../iissi-1/t10-introduccion-a-sql/puml/employees-mc.svg)

---

<!-- _class: two-col -->

# T11: stored procedures

*** left ***

```sql
DELIMITER //
CREATE PROCEDURE p_raise_fee(IN p_pct DECIMAL(4,2))
BEGIN
  UPDATE empleado
  SET fee = fee * (1 + p_pct / 100);
END//
DELIMITER ;
```

*** right ***

![](../../iissi-1/t11-sql-avanzado/images/sintaxis-procedimientos.png)

---

<!-- _class: two-col-7-3 -->

# T12: transaction states

*** left ***

Typical DBMS states:

- `Active`
- `Partially_Committed`
- `Committed`
- `Aborted`
- `Finished`

*** right ***

![](../../iissi-1/t12-gestion-de-transacciones/puml/estados_transaccion_sgbd.svg)

---

<!-- _class: content -->

# Guide map

- Section 1. Typography and code fonts
- Section 2. Base layouts and images
- Section 3. Vertical alignment
- Section 4. `mr`, `sql`, and KaTeX
- Section 5. Visual regression cases A-J
- Section 6. Realistic topic examples T1-T12
- **Section 7. Mixed regression cases K-N**

---

<!-- _class: two-col-3-7 -->

# Test K: left image with right code

*** left ***

![](images/employees-mc.svg)

*** right ***

```mr
Departamentos = {departamentoId, nombreDep, localidad}
  PK(departamentoId)
  AK(nombreDep, localidad)

Empleados = {empleadoId, departamentoId, jefeId,
  nombre, salario, fechaInicial, fechaFinal, comision}
  PK(empleadoId)
  FK(departamentoId)/Departamentos
  FK(jefeId)/Empleados
```

Additional text below the code block.

---

<!-- _class: two-col-7-3 -->

# Test L: left code with right image

*** left ***

Text above the code.

```sql
CREATE TABLE cuentas (
  numcta SMALLINT KEY,
  titular VARCHAR(20) NOT NULL,
  saldo DECIMAL(9,2) NOT NULL,
  CHECK (saldo >= 0)
);
```

Text below the code.

*** right ***

![](images/ejemplo-t7-relacion.png)

---

<!-- _class: two-col -->

# Test M: 50/50 image and code

*** left ***

Text above the image.

![](images/ejemplo-t2-ciclos-evolutivos.png)

Text below the image.

*** right ***

Text above the code.

```mr
Pedido(id_ped, fecha, FK id_cli)
Cliente(id_cli, nombre, ciudad)
```

Text below the code.

---

<!-- _class: two-col -->

# Test N: 50/50 code and image, inverted

*** left ***

Text above the code.

```sql
SELECT e.nombre, d.nombre
FROM Empleado e
JOIN Departamento d ON d.id_dept = e.id_dept;
```

Text below the code.

*** right ***

Text above the image.

![](images/ejemplo-t1-proyecto-software.png)

Text below the image.
