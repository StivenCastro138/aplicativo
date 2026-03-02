import { NavigatorScreenParams, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  MainDrawer: NavigatorScreenParams<DrawerParamList>;
};

export type DrawerParamList = {
  Dashboard: NavigatorScreenParams<TabParamList>;
  Perfil: undefined;
  Alertas: undefined;
  Usuarios: undefined;
  Reportes: undefined;
  AcercaDe: undefined;
  Ayuda: undefined;
  Politicas: undefined;
  Configuracion: undefined;
  Notificaciones: undefined;
  Soporte: undefined;
  Predicciones: undefined;
  PrediccionEstanques: undefined;
  PrediccionTruchasSARIMA: undefined;
  PrediccionLechugasSARIMA: undefined;
  PrediccionTruchasAvanzada: undefined;
  PrediccionLechugasAvanzada: undefined;
};

export type TabParamList = {
  Home: undefined;
  Cultivos: undefined;
  Tanques: undefined;
};

export type HeaderNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList>,
    StackNavigationProp<RootStackParamList>
  >
>;