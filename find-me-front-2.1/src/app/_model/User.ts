export class User{

    userId!:  number
    firstName!: string
    lastName!: string
    address!: string
    password!: string
    email!: string
    phone!: string
    dateOfBirth!: Date
    sexe!: string
    nomSociete!: string
    linkedinUrl!: string
    status!: Status
}

export enum Status{
    PENDING,
    ACTIVE,
    INACTIVE
}