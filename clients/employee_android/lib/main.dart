import 'package:flutter/material.dart';

import 'src/app.dart';
import 'src/config/app_environment.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final environment = AppEnvironment.fromCompileTime();
  runApp(CompanyHubEmployeeApp(environment: environment));
}
