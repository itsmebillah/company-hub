# Company Locations

## Purpose

Office/branch location management and employee location access for GPS attendance.

## Structure

- `actions/`: location CRUD and assignment actions.
- `components/`: location management UI.
- `services/`: location validation, access, archive/default logic.
- `types/`: location form and list contracts.

## Flow

Admins configure active locations and employee access. Attendance validates against assigned active locations.

## Dependencies


## Rules

Distance validation belongs on the server. Support multiple locations from day one.
