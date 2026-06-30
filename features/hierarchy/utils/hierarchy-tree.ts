import type {
  HierarchyEmployee,
  HierarchyNode,
  HierarchyProfile,
} from "@/features/hierarchy/types/hierarchy.types";

export function buildHierarchyTree(employees: HierarchyEmployee[]): HierarchyNode[] {
  const nodeById = new Map<string, HierarchyNode>();

  employees.forEach((employee) => {
    nodeById.set(employee.id, { ...employee, children: [] });
  });

  const roots: HierarchyNode[] = [];

  nodeById.forEach((node) => {
    if (node.managerId && nodeById.has(node.managerId)) {
      nodeById.get(node.managerId)?.children.push(node);
      return;
    }

    roots.push(node);
  });

  return roots.sort((a, b) => a.name.localeCompare(b.name));
}

export function getHierarchyProfile(
  employeeId: string,
  employees: HierarchyEmployee[],
): HierarchyProfile | null {
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  const employee = employeeById.get(employeeId);

  if (!employee) {
    return null;
  }

  const directReports = employees.filter((item) => item.managerId === employee.id);
  const hierarchyPath: HierarchyEmployee[] = [];
  let current: HierarchyEmployee | undefined = employee;

  while (current) {
    hierarchyPath.unshift(current);
    current = current.managerId ? employeeById.get(current.managerId) : undefined;
  }

  return {
    ...employee,
    reportsTo: employee.managerId ? employeeById.get(employee.managerId)?.name ?? null : null,
    directReports,
    hierarchyPath,
  };
}
