class ProfileState {
  const ProfileState({required this.employeeId, required this.name, required this.companyName, required this.roleName, required this.phone, required this.email, required this.dateOfBirth, required this.joiningDate, required this.photoUrl});
  factory ProfileState.fromJson(Map<String, Object?> j) => ProfileState(employeeId: j['employeeId'] as String? ?? '', name: j['name'] as String? ?? '', companyName: j['companyName'] as String? ?? '', roleName: j['roleName'] as String? ?? '', phone: j['phone'] as String? ?? '', email: j['email'] as String? ?? '', dateOfBirth: j['dateOfBirth'] as String? ?? '', joiningDate: j['joiningDate'] as String? ?? '', photoUrl: j['photoUrl'] as String?);
  final String employeeId, name, companyName, roleName, phone, email, dateOfBirth, joiningDate; final String? photoUrl;
}
