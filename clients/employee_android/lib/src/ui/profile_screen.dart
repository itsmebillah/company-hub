import 'package:flutter/material.dart';
import '../controllers/session_controller.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({required this.controller, super.key});
  final SessionController controller;
  @override State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final phone = TextEditingController();
  final email = TextEditingController();
  bool editing = false, saving = false;
  String dob = '';
  @override void dispose() { phone.dispose(); email.dispose(); super.dispose(); }
  void begin() { final p = widget.controller.profile; phone.text = p?.phone ?? ''; email.text = p?.email ?? ''; dob = p?.dateOfBirth ?? ''; setState(() => editing = true); }
  Future<void> save() async { setState(() => saving = true); final ok = await widget.controller.updateProfile(phone: phone.text, email: email.text, dateOfBirth: dob); if (mounted) setState(() { saving = false; editing = !ok; }); }
  @override Widget build(BuildContext context) { final p = widget.controller.profile; final s = widget.controller.session!.profile; final name = p?.name ?? s.name; return ListView(key: const Key('profileScreen'), padding: const EdgeInsets.all(20), children: [Center(child: p?.photoUrl?.isNotEmpty == true ? CircleAvatar(radius: 42, backgroundImage: NetworkImage(p!.photoUrl!)) : CircleAvatar(key: const Key('profileAvatar'), radius: 42, child: Text(_initials(name)))), const SizedBox(height: 16), Text(name, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall), Text(p?.roleName ?? s.roleName, textAlign: TextAlign.center), const SizedBox(height: 24), Card(child: Padding(padding: const EdgeInsets.all(16), child: editing ? _form(context) : _view(p, s))),]); }
  Widget _view(dynamic p, dynamic s) => Column(children: [ListTile(title: const Text('Employee ID'), subtitle: Text(p?.employeeId ?? s.employeeId, key: const Key('profileEmployeeId'))), ListTile(title: const Text('Role'), subtitle: Text(p?.roleName ?? s.roleName, key: const Key('profileRole'))), ListTile(title: const Text('Date of birth'), subtitle: Text(p?.dateOfBirth ?? 'Not set')), ListTile(title: const Text('Phone'), subtitle: Text(p?.phone ?? 'Not set')), FilledButton.icon(key: const Key('editProfileButton'), onPressed: begin, icon: const Icon(Icons.edit), label: const Text('Edit profile'))]);
  Widget _form(BuildContext context) => Column(children: [TextField(controller: phone, decoration: const InputDecoration(labelText: 'Phone')), const SizedBox(height: 12), TextField(controller: email, decoration: const InputDecoration(labelText: 'Email')), ListTile(title: const Text('Date of birth'), subtitle: Text(dob.isEmpty ? 'Not set' : dob), onTap: () async { final d = await showDatePicker(context: context, firstDate: DateTime(1900), lastDate: DateTime.now(), initialDate: DateTime.tryParse(dob) ?? DateTime(1990)); if (d != null) setState(() => dob = '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}'); }), Row(children: [Expanded(child: OutlinedButton(onPressed: saving ? null : () => setState(() => editing = false), child: const Text('Cancel'))), const SizedBox(width: 8), Expanded(child: FilledButton(onPressed: saving ? null : save, child: saving ? const CircularProgressIndicator() : const Text('Save')))]),]);
  String _initials(String n) => n.trim().split(RegExp(r'\s+')).where((x) => x.isNotEmpty).take(2).map((x) => x[0].toUpperCase()).join();
}
