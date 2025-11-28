import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsRut(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsRut',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _: ValidationArguments) {
          if (value === null || value === undefined) return false;

          const str = String(value).toUpperCase().trim();

          const rut = str.replace(/\./g, '').replace('-', '');

          if (!/^[0-9]+[0-9K]$/.test(rut)) return false;

          const cuerpo = rut.slice(0, -1);
          const dv = rut.slice(-1);

          let suma = 0;
          let multiplo = 2;

          for (let i = cuerpo.length - 1; i >= 0; i--) {
            suma += Number(cuerpo[i]) * multiplo;
            multiplo = multiplo === 7 ? 2 : multiplo + 1;
          }

          const resto = suma % 11;
          const dvEsperadoNum = 11 - resto;

          const dvEsperado =
            dvEsperadoNum === 11 ? '0'
            : dvEsperadoNum === 10 ? 'K'
            : dvEsperadoNum.toString();

          return dv === dvEsperado;
        },
        defaultMessage(_: ValidationArguments) {
          return 'El RUT ingresado no es válido';
        },
      },
    });
  };
}