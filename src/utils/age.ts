export const getAge = (dob: string) => {
  if (!dob) return '-'; // Handle null/empty dates

  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  let month = today.getMonth() - birthDate.getMonth();

  if (month < 0) {
    age--;
    month += 12;
  }

  if (month > 0) {
    return `${age} tahun ${month} bulan`;
  }

  return `${age} tahun`;
};
