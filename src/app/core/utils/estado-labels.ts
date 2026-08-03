const LABELS_CHOFER: Record<string, string> = {
  disponible: 'Disponible',
  no_disponible: 'No disponible',
  esperando_iniciar_viaje: 'Esperando iniciar viaje',
  viajando: 'Viajando',
  inactivo: 'Inactivo',
  licencia: 'Licencia',
};

const LABELS_CAMION: Record<string, string> = {
  disponible: 'Disponible',
  no_disponible: 'No disponible',
  esperando_iniciar_viaje: 'Esperando iniciar viaje',
  viajando: 'Viajando',
};

const LABELS_ACOPLADO: Record<string, string> = {
  disponible: 'Disponible',
  no_disponible: 'No disponible',
  esperando_iniciar_viaje: 'Esperando iniciar viaje',
  viajando: 'Viajando',
};

export function labelEstadoChofer(estado: string): string {
  return LABELS_CHOFER[estado] ?? estado;
}

export function labelEstadoCamion(estado: string): string {
  return LABELS_CAMION[estado] ?? estado;
}

export function labelEstadoAcoplado(estado: string): string {
  return LABELS_ACOPLADO[estado] ?? estado;
}
