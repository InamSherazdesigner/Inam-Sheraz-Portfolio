declare module 'nodemailer' {
  const nodemailer: any;
  export default nodemailer;
  export function createTransport(options: any): any;
}
