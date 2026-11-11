import { useState } from 'react';

export function useProfileState() {
  const [name, setName] = useState('Nguyễn Hân');
  const [email, setEmail] = useState('han.nguyen@email.com');
  const [phone, setPhone] = useState('');
  return { name, setName, email, setEmail, phone, setPhone };
}
