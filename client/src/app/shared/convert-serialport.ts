function tstConvertSerialPort(data: string): { state: string; value: number } {
  const state = data.substr(2, 1);
  const value = Number(data.substr(8, 12));
  return { state: state, value: value };
}
