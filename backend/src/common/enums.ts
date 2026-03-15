export enum RoleEnum {
  DEALER = 'dealer',
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  INVENTORY_CLERK = 'inventory_clerk',
  RECEPTION = 'reception',
}

export enum POStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  RECEIVED = 'received',
  CLOSED = 'closed',
}

export enum RequestStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PARTIAL = 'partial',
}

export enum StockMovementType {
  PURCHASE = 'purchase',
  ISSUE = 'issue',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment',
  DAMAGE = 'damage',
  TRANSFER = 'transfer',
  SALE = 'sale',
}
