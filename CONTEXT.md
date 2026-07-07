# Preschool LMS

A back-office tool for a small preschool. Captures daily observations of each kid so that reports (daily parent, monthly, quarterly) can be generated instead of hand-composed.

## Language

### People

**Kid**:
A child enrolled at the preschool. The central entity around which observations are recorded and reports are generated.
_Avoid_: Student, child, student (use "Kid" everywhere — matches the preschool's own vocabulary).

**Kid Status**:
The lifecycle stage of a kid: `waiting` (on the waiting list, not yet enrolled), `enrolled` (attending sessions), or `alumni` (graduated or left). Only `enrolled` kids appear in session rosters and reports.
_Avoid_: Active/inactive (too generic — hides the waiting-list and alumni distinctions).

**Guardian**:
The parent or caretaker who receives a kid's reports. One guardian is registered per kid; a guardian may be linked to multiple kids (siblings). A second guardian (e.g., the other parent) is an optional contact field on the guardian record, not a separate entity — multi-guardian login is deferred to a later phase.
_Avoid_: Parent (overloaded — "parent" of what?), mom/dad.

**Teacher**:
A staff member who leads a class session and captures observations during it.
_Avoid_: Staff, educator.

**Owner**:
The preschool's owner-operator (Hanifah). Has full access, reviews/polishes generated reports, captures the Daily Class Report, and is the default actor when no other is specified.
_Avoid_: Admin, principal.

### Capture

**Observation**:
A single structured record of something noted about a kid during a session (e.g., mood, appetite, an activity participated in, absence). Captured by recall _after_ the session ends — not in real time — within the memory window the short class length allows. The atomic unit of the system; reports are projections of stored observations.
_Avoid_: Entry, log, report-item, data-point.

**Note**:
A free-text remark about a kid (e.g., "extra talkative today," "fell asleep early"). Unstructured, per-kid, surfaces in the Daily Parent Report narrative only — not aggregated into monthly/quarterly reports.
_Avoid_: Comment, annotation (too generic).

**Activity**:
Something a class or kid does during a session (e.g., painting, circle time, free play). Selected from the Activity Catalog by the owner at the class level when capturing the Daily Class Report; teachers then record per-kid participation by tapping. "Other" free-text activities may be added at the class level only.
_Avoid_: Task, exercise, lesson.

**Activity Catalog**:
The predefined list of activities the owner maintains. The source of consistent vocabulary that enables monthly/quarterly aggregation by activity.
_Avoid_: Activity list, library.

**Session**:
A scheduled class period on a given date (e.g., the morning session, 9–11am). Observations belong to one kid in one session. A preschool day may run more than one session.
_Avoid_: Class (overloaded), period, slot.

### Reports

**Daily Parent Report**:
A generated view of one kid's observations for one school day, drafted for that kid's guardian(s). Owner may edit a short narrative layer on top before sending.
_Avoid_: Daily report (ambiguous — see Daily Class Report).

**Monthly Report**:
A generated summary of one kid's observations across a calendar month.

**Quarterly Report**:
A generated summary of one kid's observations across a school quarter (≈3 months).

**Daily Class Report**:
A whole-class summary of one session — the activities run that day and what the class learned. Captured by the owner (not teachers). Distinct from per-kid Daily Parent Reports, which are projections of individual observations.
_Avoid_: Class summary, session recap.
