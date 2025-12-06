using HSP.Core.Dtos.EquipmentRequest;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations.Internal
{
    public class EquipmentRequestService : IEquipmentRequestService
    {
        private readonly IRepository<BookingEquipment, Guid> _bookingEquipmentRepository;
        private readonly IRepository<Booking, Guid> _bookingRepository;
        private readonly IRepository<Equipment, Guid> _equipmentRepository;
        private readonly IRepository<Payment, Guid> _paymentRepository;
        private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IStringLocalizer<EquipmentRequestService> _localizer;

        public EquipmentRequestService(
            IRepository<BookingEquipment, Guid> bookingEquipmentRepository,
            IRepository<Booking, Guid> bookingRepository,
            IRepository<Equipment, Guid> equipmentRepository,
            IRepository<Payment, Guid> paymentRepository,
            IRepository<TechnicianProfile, Guid> technicianRepository,
            IUnitOfWork unitOfWork,
            IStringLocalizer<EquipmentRequestService> localizer)
        {
            _bookingEquipmentRepository = bookingEquipmentRepository;
            _bookingRepository = bookingRepository;
            _equipmentRepository = equipmentRepository;
            _paymentRepository = paymentRepository;
            _technicianRepository = technicianRepository;
            _unitOfWork = unitOfWork;
            _localizer = localizer;
        }

        public async Task<(List<EquipmentRequestDto> Items, int TotalCount, int TotalPages)> GetAllEquipmentRequestsAsync(EquipmentRequestFilterDto filter)
        {
            var query = _bookingEquipmentRepository.GetAll()
                .Include(be => be.Booking)
                    .ThenInclude(b => b.Customer)
                .Include(be => be.Booking)
                    .ThenInclude(b => b.Technician)
                        .ThenInclude(t => t.User)
                .Include(be => be.Equipment)
                .Include(be => be.Payment)
                .Where(be => !be.IsDeleted);

            // Filter by status
            if (filter.Status.HasValue)
            {
                query = query.Where(be => be.Status == filter.Status.Value);
            }
            else
            {
                // Default: show Paid, AwaitingDelivery, and Delivered for tracking and management
                query = query.Where(be => be.Status == BookingEquipmentStatus.Paid 
                    || be.Status == BookingEquipmentStatus.AwaitingDelivery
                    || be.Status == BookingEquipmentStatus.Delivered);
            }

            if (filter.BookingId.HasValue)
            {
                query = query.Where(be => be.BookingId == filter.BookingId.Value);
            }

            if (filter.TechnicianId.HasValue)
            {
                query = query.Where(be => be.Booking.Technician.User.Id == filter.TechnicianId.Value);
            }

            // Order by DateModified descending (newest first)
            query = query.OrderByDescending(be => be.Booking.DateModified);

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);

            var items = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(be => new EquipmentRequestDto
                {
                    Id = be.Id,
                    BookingId = be.BookingId,
                    BookingCode = be.Booking.Id.ToString().Substring(0, 8),
                    EquipmentId = be.EquipmentId,
                    EquipmentName = be.Equipment.Name,
                    Quantity = be.Quantity,
                    UnitPrice = be.UnitPrice,
                    TotalPrice = be.Quantity * be.UnitPrice,
                    Status = be.Status,
                    PaymentId = be.PaymentId,
                    CustomerName = be.Booking.Customer.FullName,
                    CustomerPhone = be.Booking.Customer.PhoneNumber,
                    TechnicianName = be.Booking.Technician.User.FullName,
                    TechnicianPhone = be.Booking.Technician.User.PhoneNumber,
                    DateCreated = be.Booking.DateCreated,
                    DateModified = be.Booking.DateModified
                })
                .ToListAsync();

            return (items, totalCount, totalPages);
        }

        public async Task<EquipmentRequestDetailDto?> GetEquipmentRequestDetailAsync(Guid requestId)
        {
            var bookingEquipment = await _bookingEquipmentRepository.GetAll()
                .Include(be => be.Booking)
                    .ThenInclude(b => b.Customer)
                .Include(be => be.Booking)
                    .ThenInclude(b => b.Technician)
                        .ThenInclude(t => t.User)
                .Include(be => be.Booking)
                    .ThenInclude(b => b.Items)
                        .ThenInclude(i => i.Service)
                .Include(be => be.Booking)
                    .ThenInclude(b => b.Equipments)
                        .ThenInclude(e => e.Equipment)
                .Include(be => be.Equipment)
                .Include(be => be.Payment)
                .FirstOrDefaultAsync(be => be.Id == requestId && !be.IsDeleted);

            if (bookingEquipment == null) return null;

            var booking = bookingEquipment.Booking;

            var result = new EquipmentRequestDetailDto
            {
                Id = bookingEquipment.Id,
                BookingId = bookingEquipment.BookingId,
                BookingCode = booking.Id.ToString().Substring(0, 8),
                EquipmentId = bookingEquipment.EquipmentId,
                EquipmentName = bookingEquipment.Equipment.Name,
                Quantity = bookingEquipment.Quantity,
                UnitPrice = bookingEquipment.UnitPrice,
                TotalPrice = bookingEquipment.Quantity * bookingEquipment.UnitPrice,
                Status = bookingEquipment.Status,
                PaymentId = bookingEquipment.PaymentId,
                CustomerName = booking.Customer.FullName,
                CustomerPhone = booking.Customer.PhoneNumber,
                TechnicianName = booking.Technician.User.FullName,
                TechnicianPhone = booking.Technician.User.PhoneNumber,
                DateCreated = booking.DateCreated,
                DateModified = booking.DateModified,
                BookingDetail = new BookingDetailInfo
                {
                    Id = booking.Id,
                    DesiredDate = booking.DesiredDate,
                    Status = booking.Status.ToString(),
                    Latitude = (decimal)booking.Latitude,
                    Longitude = (decimal)booking.Longitude,
                    DateCreated = booking.DateCreated,
                    DateModified = booking.DateModified,
                    Customer = new CustomerInfo
                    {
                        FullName = booking.Customer.FullName,
                        PhoneNumber = booking.Customer.PhoneNumber
                    },
                    Technician = new TechnicianInfo
                    {
                        FullName = booking.Technician.User.FullName,
                        PhoneNumber = booking.Technician.User.PhoneNumber
                    },
                    Services = booking.Items.Select(i => new ServiceInfo
                    {
                        Name = i.Service.Name,
                        Price = i.Price
                    }).ToList(),
                    AllEquipments = booking.Equipments.Where(e => !e.IsDeleted).Select(e => new EquipmentInfo
                    {
                        Id = e.Id,
                        Name = e.Equipment.Name,
                        Quantity = e.Quantity,
                        UnitPrice = e.UnitPrice,
                        Total = e.Quantity * e.UnitPrice,
                        Status = e.Status
                    }).ToList()
                }
            };

            if (bookingEquipment.Payment != null)
            {
                result.PaymentDetail = new PaymentDetailInfo
                {
                    Id = bookingEquipment.Payment.Id,
                    Amount = bookingEquipment.Payment.Amount,
                    ShippingFee = bookingEquipment.Payment.ShippingFee,
                    PaymentMethod = bookingEquipment.Payment.PaymentMethod.ToString(),
                    Status = bookingEquipment.Payment.Status.ToString(),
                    PaidAt = bookingEquipment.Payment.PaidAt,
                    TransactionId = bookingEquipment.Payment.TransactionId,
                    Description = bookingEquipment.Payment.Description
                };
            }

            return result;
        }

        public async Task<bool> ApproveEquipmentRequestAsync(ApproveEquipmentRequestDto input, Guid managerId)
        {
            using (var transaction = await _unitOfWork.BeginTransactionAsync())
            {
                try
                {
                    var bookingEquipments = await _bookingEquipmentRepository.GetAll()
                        .Include(be => be.Equipment)
                        .Where(be => input.BookingEquipmentIds.Contains(be.Id) && be.BookingId == input.BookingId)
                        .ToListAsync();

                    if (!bookingEquipments.Any()) return false;

                    foreach (var item in bookingEquipments)
                    {
                        // Only process items that are in Paid status
                        if (item.Status == BookingEquipmentStatus.Paid)
                        {
                            // Check inventory
                            if (item.Equipment.Quantity < item.Quantity)
                            {
                                throw new InvalidOperationException($"Sản phẩm {item.Equipment.Name} không đủ tồn kho để xuất (Còn: {item.Equipment.Quantity}, Cần: {item.Quantity})");
                            }

                            // Deduct inventory
                            item.Equipment.Quantity -= item.Quantity;

                            // Change status to AwaitingDelivery
                            item.Status = BookingEquipmentStatus.AwaitingDelivery;

                            _equipmentRepository.Update(item.Equipment);
                            _bookingEquipmentRepository.Update(item);
                        }
                    }

                    await _unitOfWork.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return true;
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
        }

        public async Task<bool> ConfirmReceiptAsync(ConfirmReceiptDto input, Guid technicianUserId)
        {
            using (var transaction = await _unitOfWork.BeginTransactionAsync())
            {
                try
                {
                    // Get technician profile
                    var technicianProfile = await _technicianRepository.GetAll()
                        .FirstOrDefaultAsync(t => t.User.Id == technicianUserId);

                    if (technicianProfile == null)
                        throw new UnauthorizedAccessException("Không tìm thấy thông tin kỹ thuật viên");

                    // Get booking to verify technician
                    var booking = await _bookingRepository.GetByIdAsync(input.BookingId);
                    if (booking == null)
                        throw new KeyNotFoundException("Không tìm thấy booking");

                    if (booking.TechnicianId != technicianProfile.Id)
                        throw new UnauthorizedAccessException("Bạn không có quyền xác nhận thiết bị cho booking này");

                    var bookingEquipments = await _bookingEquipmentRepository.GetAll()
                        .Where(be => input.BookingEquipmentIds.Contains(be.Id) && be.BookingId == input.BookingId)
                        .ToListAsync();

                    if (!bookingEquipments.Any()) return false;

                    foreach (var item in bookingEquipments)
                    {
                        // Only process items that are in AwaitingDelivery status
                        if (item.Status == BookingEquipmentStatus.AwaitingDelivery)
                        {
                            item.Status = BookingEquipmentStatus.Delivered;
                            _bookingEquipmentRepository.Update(item);
                        }
                    }

                    await _unitOfWork.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return true;
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
        }
    }
}
