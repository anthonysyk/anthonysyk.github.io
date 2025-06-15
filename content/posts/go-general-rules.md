
# Essential Go Guidelines (Rules of Thumb)

## Getters and Setters

Only use them when they are truly necessary (mutex, internal complexity, etc.). 

Otherwise, prefer simplicity.

## Big interfaces = Weak abstraction

The more methods an interface has, the harder it is to implement and the less generic it becomes.

## Interface Pollution

Interfaces should emerge from actual needs discovered during implementation, not be created preemptively. 
Designing interfaces too early adds unnecessary complexity.

**Abstraction should be discovered, not created.**

> Don’t design with interfaces, discover them.
— Rob Pike

## Interfaces should be defined on the Consumer side, not the Producer side

The package should not dictate whether a client must use an interface.

A client may not need all the methods, and forcing them to implement unnecessary ones leads to bloated code. Abstractions should not be forced; they should emerge naturally from the client's needs.

In most cases, interfaces should exist on the consumer side.

(This aligns with the Interface Segregation Principle — the "I" in SOLID.)

## Do not return an interface

Returning an interface from a function restricts the client’s flexibility in choosing the appropriate abstraction.

Instead, accept interfaces as parameters and return structs.

## Using generics

Like interfaces, generics should only be introduced when a real need arises.

Avoid unnecessary abstractions—focus on solving concrete problems. 

Use generics only when boilerplate code becomes evident.

> unnecessary abstractions introduce complexity.

## Type embedding

Avoid embedding a field when you don't want it to be accessible for external clients (e.g., mutex).

{{< admonition type=note title="Promotion vs Extension" details=false >}}
- With **embedding**, methods are promoted to the outer type.
- With **subclassing**, methods are inherited by the subclass.

Embedding is about composition, not inheritance.

```
// Embedding (Composition in Go)    |    // Subclassing (Inheritance - Not in Go)
                                    |
+-------------+                     |      +-------------+
|    Car      |                     |      |   Engine    |  <-- Parent class
| ----------- |                     |      | ----------- |
| Engine      |  <-- Embedded       |      | Start()     |
+-------------+                     |      +-------------+
       |                            |            |
       v                            |            v
+-------------+                     |      +-------------+
|   Engine    |                     |      |    Car      |  <-- Inherits from Engine
| ----------- |                     |      +-------------+
| Start()     |                     |
+-------------+                     |
```
{{</ admonition >}}

Type embeddings reduce boilerplate code but should not be overused for cosmetic purposes.

## 

