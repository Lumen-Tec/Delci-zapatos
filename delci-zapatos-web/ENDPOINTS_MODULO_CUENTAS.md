# Endpoints para modulo de Cuentas.

## Convenciones generales

- Base URL local: `http://localhost:3000`
- Formato de respuesta:
  - Exito: `{ ok: true, ... }`
  - Error: `{ ok: false, error: string, ... }`
- Fechas en formato `YYYY-MM-DD`
- Estados de cuenta validos: `activa`, `pagada`, `atrasada`

---

## 1) Cuentas

### GET /api/accounts
Devuelve listado de cuentas con metricas agregadas.

- Query params: ninguno
- Body: no aplica

Respuestas:
- `200 OK`: `{ ok: true, count, accounts }`
- `500 Internal Server Error`: `{ ok: false, error }`

Ejemplo:
```bash
curl -X GET "http://localhost:3000/api/accounts"
```

### GET /api/accounts/getById?id=<id>
Devuelve detalle completo de una cuenta.

- Query params:
  - `id` (string, requerido)
- Body: no aplica

Respuestas:
- `200 OK`: `{ ok: true, account }`
- `400 Bad Request`: `{ ok: false, error: "id es requerido" }`
- `404 Not Found`: `{ ok: false, error: "Cuenta no encontrada" }`
- `500 Internal Server Error`: `{ ok: false, error }`

Ejemplo:
```bash
curl -X GET "http://localhost:3000/api/accounts/getById?id=ACCOUNT_ID"
```

### POST /api/accounts
Crea una cuenta nueva.

- Query params: ninguno
- Body (JSON):
  - `clientId` (string, requerido)
  - `quincenalAmount` (number, requerido)
  - `initialBalance` (number, opcional, default: 0)
  - `detail` (string, opcional)

Respuestas:
- `201 Created`: `{ ok: true, created }`
- `500 Internal Server Error`: `{ ok: false, error }`

Ejemplo:
```bash
curl -X POST "http://localhost:3000/api/accounts" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "CLIENT_ID",
    "quincenalAmount": 5000,
    "initialBalance": 15000,
    "detail": "Cuenta inicial"
  }'
```

### PATCH /api/accounts
Actualiza parcialmente una cuenta por `id` en body.

- Query params: ninguno
- Body (JSON):
  - `id` (string, requerido)
  - Al menos uno de:
    - `initialBalance` (number >= 0)
    - `quincenalAmount` (number >= 0)
    - `detail` (string o null)
    - `status` (`activa` | `pagada` | `atrasada`)

Reglas de negocio destacadas:
- Si `status = pagada`, `totalAmount` y `totalPaid` deben coincidir.

Respuestas:
- `200 OK`: `{ ok: true, account }`
- `400 Bad Request`: validaciones de body/campos
- `404 Not Found`: `{ ok: false, error: "Cuenta no encontrada" }`
- `409 Conflict`: intento de marcar pagada sin pago completo
- `500 Internal Server Error`: `{ ok: false, error }`

Ejemplo:
```bash
curl -X PATCH "http://localhost:3000/api/accounts" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ACCOUNT_ID",
    "status": "pagada"
  }'
```

---

## 2) Clientes

### GET /api/clients
Devuelve listado completo de clientes.

- Query params: ninguno
- Body: no aplica

Respuestas:
- `200 OK`: `{ ok: true, count, clients }`
- `500 Internal Server Error`: `{ ok: false, error }`

Ejemplo:
```bash
curl -X GET "http://localhost:3000/api/clients"
```

### GET /api/clients/getById?id=<id>
Devuelve detalle de cliente por id.

- Query params:
  - `id` (string, requerido)
- Body: no aplica

Respuestas:
- `200 OK`: `{ ok: true, client }`
- `400 Bad Request`: `{ ok: false, error: "id es requerido" }`
- `404 Not Found`: `{ ok: false, error: "Cliente no encontrado" }`
- `500 Internal Server Error`: `{ ok: false, error }`

Ejemplo:
```bash
curl -X GET "http://localhost:3000/api/clients/getById?id=CLIENT_ID"
```

### POST /api/clients
Crea un cliente.

- Query params: ninguno
- Body (JSON):
  - `fullName` (string, requerido)
  - `phone` (string, requerido)
  - `address` (string, opcional)

Respuestas:
- `201 Created`: `{ ok: true, created }`
- `400 Bad Request`: `{ ok: false, error, errors }` cuando falla validacion
- `500 Internal Server Error`: `{ ok: false, error }`

Ejemplo:
```bash
curl -X POST "http://localhost:3000/api/clients" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Juan Perez",
    "phone": "+50688887777",
    "address": "San Jose"
  }'
```

### PATCH /api/clients
Actualiza parcialmente un cliente por `id` en body.

- Query params: ninguno
- Body (JSON):
  - `id` (string, requerido)
  - Al menos uno de:
    - `fullName` (string)
    - `phone` (string)
    - `address` (string)

Respuestas:
- `200 OK`: `{ ok: true, updated }`
- `400 Bad Request`: validaciones de body/campos
- `404 Not Found`: `{ ok: false, error: "Cliente no encontrado" }`
- `500 Internal Server Error`: `{ ok: false, error }`

Ejemplo:
```bash
curl -X PATCH "http://localhost:3000/api/clients" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "CLIENT_ID",
    "phone": "+50660001111"
  }'
```

---

## 3) Pagos

### POST /api/payments
Registra un pago para una cuenta.

- Query params: ninguno
- Body (JSON):
  - `accountId` (string, requerido)
  - `amount` (number > 0, requerido)
  - `paymentDate` (string `YYYY-MM-DD`, requerido)

Reglas de negocio destacadas:
- `amount` no puede ser mayor al saldo pendiente de la cuenta.

Respuestas:
- `201 Created`: `{ ok: true, created, account }`
- `400 Bad Request`: validaciones de body/monto/fecha
- `404 Not Found`: cuenta no existe
- `500 Internal Server Error`: `{ ok: false, error }`

Notas:
- `account` incluye el snapshot consolidado de la cuenta luego de registrar el pago (totales, status y proximo pago reconciliados en backend).

Ejemplo:
```bash
curl -X POST "http://localhost:3000/api/payments" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "ACCOUNT_ID",
    "amount": 5000,
    "paymentDate": "2026-03-30"
  }'
```

### PATCH /api/payments
Corrige monto y/o fecha de un pago existente.

- Query params: ninguno
- Body (JSON):
  - `paymentId` (string, requerido)
  - Al menos uno de:
    - `amount` (number > 0)
    - `paymentDate` (string `YYYY-MM-DD`)

Respuestas:
- `200 OK`: `{ ok: true, updated, account }`
- `400 Bad Request`: validaciones de body/campos
- `404 Not Found`: `{ ok: false, error: "Pago no encontrado" }`
- `409 Conflict`: monto corregido excede saldo pendiente
- `500 Internal Server Error`: `{ ok: false, error }`

Notas:
- `account` devuelve la cuenta reconciliada despues de corregir el pago.

Ejemplo:
```bash
curl -X PATCH "http://localhost:3000/api/payments" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "PAYMENT_ID",
    "amount": 4000
  }'
```

### DELETE /api/payments?paymentId=<id>
Elimina un pago.

- Query params:
  - `paymentId` (string, requerido)
- Body: no aplica

Respuestas:
- `200 OK`: `{ ok: true, deleted, account }`
- `400 Bad Request`: `{ ok: false, error: "paymentId es requerido" }`
- `404 Not Found`: `{ ok: false, error: "Pago no encontrado" }`
- `500 Internal Server Error`: `{ ok: false, error }`

Notas:
- `account` devuelve la cuenta reconciliada despues de eliminar el pago.

Ejemplo:
```bash
curl -X DELETE "http://localhost:3000/api/payments?paymentId=PAYMENT_ID"
```

---

## 4) Endpoint auxiliar (pruebas)

### GET /api/test-db
Prueba de conexion y lectura de cuentas.

### POST /api/test-db
Prueba de creacion de cuenta.

Nota: este endpoint es de apoyo para pruebas internas; no recomendado para consumo productivo externo.
