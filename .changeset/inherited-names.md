---
'@nepdatejs/core': patch
'@nepdatejs/datepicker': patch
---

Names that every object inherits, such as `constructor`, are no longer mistaken for a named format, a message value or a preset label. `formatDate(date, 'constructor')` used to throw.
