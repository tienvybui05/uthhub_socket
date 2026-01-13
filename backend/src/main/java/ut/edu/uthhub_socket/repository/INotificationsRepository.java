package ut.edu.uthhub_socket.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import ut.edu.uthhub_socket.model.Notifications;

import java.util.List;

public interface INotificationsRepository  extends JpaRepository<Notifications, Long> {
    List<Notifications> findAllByUser_IdOrderByCreatedAtDesc(Integer userId);
    List<Notifications> findAllByUser_IdAndIsReadFalseOrderByCreatedAtDesc(Integer userId);


}
