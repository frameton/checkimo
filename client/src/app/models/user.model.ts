// models/user.ts
// ─────────────────────────────────────────────────────────────
// Modèle "User" centralisé pour l'ensemble du front Checkimo.
// Inclut :
//   • Typage complet des propriétés (UserProps)
//   • Classe User avec méthode statique `hydrate` pour convertir
//     un plain‑object (ex. JSON d'API) en instance riche.
//   • Getter utilitaire `fullName` et sérialisation `toJSON()`.
// ─────────────────────────────────────────────────────────────

/**
 * Rôle métier reconnu par l'application.
 * Ajoutez ici les rôles supplémentaires si nécessaire.
 */
export type UserRole = 'ADMIN' | 'USER';

/**
 * Shape brute d'un utilisateur tel que renvoyé/parsé en JSON.
 */
export interface UserProps {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Classe métier User.
 * Encapsule la donnée + expose la logique utilitaire.
 */
export class User implements UserProps {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<UserProps> = {}) {
    this.id = props.id ?? '';
    this.email = props.email ?? '';
    this.firstName = props.firstName ?? '';
    this.lastName = props.lastName ?? '';
    this.role = props.role ?? 'USER';
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  /**
   * Transforme un plain‑object (p. ex. issu de `fetch`/`HttpClient`) en
   * instance *vivante* de `User`, avec des Date correctement typées.
   *
   * @param data résultat brut JSON ou partiel
   * @returns instance prête à l'emploi
   */
  static hydrate(data: Partial<UserProps>): User {
    return new User({
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    });
  }

  /**
   * Sérialise l'instance vers un objet prêt à être envoyé à l'API.
   */
  toJSON(): UserProps {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /** Nom complet de l'utilisateur. */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  get initiales(): string {
    return `${this.firstName[0]}.${this.lastName[0]}`.trim();
  }
}
