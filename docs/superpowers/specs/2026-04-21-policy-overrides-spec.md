# Policy Overrides Editable Specification

> **Feature:** Make attendance policy overrides fully editable and deletable.

**Goal:** Allow HR/admins to edit scope_type dropdown and delete overrides from the settings page.

---

## Background

**Current State:**
- Scope type dropdown (`organization`, `team`, `user`) and target fields are disabled when editing existing override
- No delete option exists
- Only editable: times, grace period, onsite days

**Desired Behavior:**
- Full edit capability: change scope_type, target, priority, schedule settings
- Delete functionality for removing unwanted overrides

---

## Requirements

### 1. Edit Scope Type & Target
- Remove all `disabled={!!policy}` attributes from form fields
- When scope_type changes: clear current scopeId, require re-selection
- When target (org/team/user) changes: require re-selection

### 2. Delete Override
- Add delete button to each row in overrides table
- Confirmation dialog before delete
- API: `policyApi.deletePolicy(id)` or equivalent

### 3. Edit Flow
- **Same scope:** Update in place
- **Changed scope:** Delete old policy → Create new with new scope
- **Priority editable:** Allow priority changes

---

## Files to Modify

| File | Change |
|------|--------|
| `apps/pwa/src/modules/hr/settings/AttendanceOverrideSlideOver.tsx` | Remove disabled, add delete state |
| `apps/pwa/src/modules/hr/settings/AttendanceSettingsTab.tsx` | Add delete handler, delete button in table |

---

## API Requirements

```typescript
// Expected API (verify existing or add):
policyApi.deletePolicy(id: string): Promise<void>
```

---

## Acceptance Criteria

1. Scope type dropdown is editable for existing override
2. Target dropdown is editable (shows options based on new scope type)
3. Priority field is editable
4. Delete button exists for each override row
5. Delete shows confirmation before action
6. Changing scope creates new override instead of updating

---

## UI Changes

### Override Table (AttendanceSettingsTab.tsx)
```tsx
<TableCell>
  <Button variant="ghost" size="sm" onClick={() => setEditingPolicy(row)}>
    Edit
  </Button>
  <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="ml-2 text-danger">
    Delete
  </Button>
</TableCell>
```

### Slide-over Form (AttendanceOverrideSlideOver.tsx)
- Remove `disabled={!!policy}` from: scopeType select, target select(s), priority field