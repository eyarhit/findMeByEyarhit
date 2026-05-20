export class Role{
    roleId!: number
    role!: ERole
}

export enum ERole{
    ADMIN,
    FREELANCER,
    CHARGERECRUTEMENT,
    CANDIDAT,
    ENTREPRISE
}