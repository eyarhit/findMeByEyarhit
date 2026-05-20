export interface Role{

    userId? : number | null,
    role: ERole
}

export enum ERole{
    ADMIN = 'ADMIN',
    INGENIEURAFFAIRE = 'INGENIEURAFFAIRE',
    CHARGERECRUTEMENT = 'CHARGERECRUTEMENT',
    CANDIDAT = 'CANDIDAT',
    ENTREPRISE = 'ENTREPRISE'
}