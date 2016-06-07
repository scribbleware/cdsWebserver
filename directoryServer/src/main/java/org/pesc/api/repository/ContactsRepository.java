package org.pesc.api.repository;

import org.pesc.api.model.Contact;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

/**
 * Created by james on 6/6/16.
 */
@Repository
public interface ContactsRepository extends CrudRepository<Contact, Integer> {

}
